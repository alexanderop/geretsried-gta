/**
 * The WebGL2 renderer: the town's static chunks (built once each, as they
 * come near the view), then the shadows over the ground, then the moving
 * sprites, all in the same perspective, so a building hides a car behind it.
 *
 * Passes: opaque (ground layers, walls, roofs, tree crowns with
 * alpha-to-coverage); shadows (blended, each pixel darkened once through the
 * stencil); sprites (cars, people, traffic lights, blended).
 */
import type { World } from "#/world/world.ts"
import type { Game } from "#/sim/game.ts"
import { GROUND_M_PER_PX } from "#/map/types.ts"
import type { Assets } from "../assets.ts"
import { groundBox, viewMatrix, type View } from "../camera.ts"
import { CHUNK_M, Scene } from "../scene/scene.ts"
import { MeshBuilder, STRIDE, type Mesh } from "../scene/mesh.ts"
import { drawEntities } from "../scene/entities.ts"
import { program, type Program } from "./program.ts"
import { uploadTextures, type Textures } from "./textures.ts"

const VS = `#version 300 es
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec2 a_uv;
layout(location = 2) in vec4 a_color;
layout(location = 3) in uvec2 a_kind;
uniform mat4 u_view;
out vec2 v_uv;
out vec2 v_xy;
out vec4 v_color;
flat out uint v_mode;
flat out float v_layer;
void main() {
  v_uv = a_uv;
  v_xy = a_pos.xy;
  v_color = a_color;
  v_mode = a_kind.x;
  v_layer = float(a_kind.y);
  gl_Position = u_view * vec4(a_pos, 1.0);
}`

const FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray u_mat;
uniform sampler2DArray u_spr;
uniform sampler2D u_mask;
uniform vec2 u_maskScale;
in vec2 v_uv;
in vec2 v_xy;
in vec4 v_color;
flat in uint v_mode;
flat in float v_layer;
out vec4 o;
void main() {
  vec4 c;
  if (v_mode == 0u) {
    c = texture(u_mat, vec3(v_uv, v_layer)) * v_color;
  } else if (v_mode == 1u) {
    // A hard edge one screen pixel wide wherever the 2 m mask crosses half: crisp at every zoom.
    float m = texture(u_mask, v_xy * u_maskScale).r;
    float w = max(fwidth(m), 1e-3);
    float paved = smoothstep(0.55 - w, 0.55 + w, m);
    vec3 lawn = texture(u_mat, vec3(v_xy / 6.0, 0.0)).rgb;
    vec3 pave = texture(u_mat, vec3(v_xy / 5.0, 3.0)).rgb * vec3(1.0, 0.98, 0.95);
    c = vec4(mix(lawn, pave, paved), 1.0);
  } else if (v_mode == 2u) {
    c = vec4(v_color.rgb * texture(u_mat, vec3(v_uv, v_layer)).r * 2.0, 1.0);
  } else if (v_mode == 3u) {
    vec4 t = texture(u_spr, vec3(v_uv, v_layer));
    if (t.a < 0.08) discard;
    c = vec4(t.rgb / t.a, t.a) * v_color;
  } else if (v_mode == 4u) {
    if (texture(u_spr, vec3(v_uv, v_layer)).a < 0.5) discard;
    c = v_color;
  } else {
    c = v_color;
  }
  o = c;
}`

type Uniform = "u_view" | "u_mat" | "u_spr" | "u_mask" | "u_maskScale"

type GpuChunk = { readonly vao: WebGLVertexArrayObject; readonly opaque: number; readonly shadow: number }

/** Meters past the view whose chunks are built ahead, so driving rarely waits. */
const PREFETCH_M = 90

export type RenderStats = { chunks: number; triangles: number; buildMs: number }

export class Renderer {
  private readonly prog: Program<Uniform>
  private readonly tex: Textures
  private readonly scene: Scene
  private readonly chunks = new Map<number, GpuChunk>()
  private readonly entities = new MeshBuilder()
  private readonly dynamic: { readonly vao: WebGLVertexArrayObject; readonly vbo: WebGLBuffer }
  readonly stats: RenderStats = { chunks: 0, triangles: 0, buildMs: 0 }

  constructor(
    private readonly gl: WebGL2RenderingContext,
    world: World,
    assets: Assets,
  ) {
    this.prog = program(gl, VS, FS, ["u_view", "u_mat", "u_spr", "u_mask", "u_maskScale"])
    this.tex = uploadTextures(gl, assets)
    this.scene = new Scene(world, assets.crowns, this.tex.boxes)
    const vbo = gl.createBuffer()
    const ibo = gl.createBuffer()
    this.dynamic = { vao: this.vertexArray(vbo, ibo), vbo }
    gl.bindVertexArray(null)
  }

  /**
   * Draw one frame of `view` into the drawing buffer. Builds missing chunks
   * for up to `budgetMs`; returns false while part of the view is not built.
   */
  frame(view: View, game: Game | null, budgetMs: number): boolean {
    const { gl } = this
    const complete = this.buildChunks(view, budgetMs)
    const visible = this.scene.keysIn(groundBox(view, 2)).flatMap((key) => this.chunks.get(key) ?? [])

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.clearColor(0.36, 0.45, 0.3, 1)
    gl.clearDepth(1)
    gl.clearStencil(0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    gl.useProgram(this.prog.program)
    const u = this.prog.uniforms
    gl.uniformMatrix4fv(u.u_view, false, viewMatrix(view))
    gl.uniform2f(u.u_maskScale, 1 / (GROUND_M_PER_PX * this.tex.maskSize[0]), 1 / (GROUND_M_PER_PX * this.tex.maskSize[1]))
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex.materials)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex.sprites)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.tex.mask)
    gl.uniform1i(u.u_mat, 0)
    gl.uniform1i(u.u_spr, 1)
    gl.uniform1i(u.u_mask, 2)

    let triangles = 0
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.depthMask(true)
    gl.disable(gl.BLEND)
    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE)
    for (const c of visible) {
      gl.bindVertexArray(c.vao)
      gl.drawElements(gl.TRIANGLES, c.opaque, gl.UNSIGNED_INT, 0)
      triangles += c.opaque / 3
    }
    gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE)

    const dyn = this.uploadEntities(game)
    gl.depthMask(false)
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    // Overlapping shadows darken a pixel once, like one shadow.
    gl.enable(gl.STENCIL_TEST)
    gl.stencilFunc(gl.EQUAL, 0, 0xff)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR)
    for (const c of [...visible, dyn]) {
      if (c.shadow === 0) continue
      gl.bindVertexArray(c.vao)
      gl.drawElements(gl.TRIANGLES, c.shadow, gl.UNSIGNED_INT, c.opaque * 4)
      triangles += c.shadow / 3
    }
    gl.disable(gl.STENCIL_TEST)

    if (dyn.opaque > 0) {
      gl.bindVertexArray(dyn.vao)
      gl.drawElements(gl.TRIANGLES, dyn.opaque, gl.UNSIGNED_INT, 0)
    }
    gl.bindVertexArray(null)
    gl.depthMask(true)
    this.stats.chunks = visible.length
    this.stats.triangles = triangles
    return complete
  }

  /** Build the chunks the view (plus a margin) needs, nearest first, within the time budget. */
  private buildChunks(view: View, budgetMs: number): boolean {
    const start = performance.now()
    const { x, y } = view.camera
    const wanted = this.scene.keysIn(groundBox(view, PREFETCH_M)).filter((key) => !this.chunks.has(key))
    const inView = new Set(this.scene.keysIn(groundBox(view, 2)))
    wanted.sort((a, b) => this.distance(a, x, y) - this.distance(b, x, y))
    for (const key of wanted) {
      if (performance.now() - start > budgetMs) break
      this.chunks.set(key, this.upload(this.scene.build(key)))
    }
    this.stats.buildMs = performance.now() - start
    return [...inView].every((key) => this.chunks.has(key))
  }

  private distance(key: number, x: number, y: number) {
    const cx = ((key % this.scene.cols) + 0.5) * CHUNK_M
    const cy = (Math.floor(key / this.scene.cols) + 0.5) * CHUNK_M
    return Math.hypot(cx - x, cy - y)
  }

  private upload(mesh: Mesh): GpuChunk {
    const { gl } = this
    const vbo = gl.createBuffer()
    const ibo = gl.createBuffer()
    const vao = this.vertexArray(vbo, ibo)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)
    gl.bindVertexArray(null)
    return { vao, opaque: mesh.opaque, shadow: mesh.shadow }
  }

  /** A vertex array over `vbo` with the vertex layout of mesh.ts; leaves it bound. */
  private vertexArray(vbo: WebGLBuffer, ibo: WebGLBuffer): WebGLVertexArrayObject {
    const { gl } = this
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE, 12)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, STRIDE, 20)
    gl.enableVertexAttribArray(3)
    gl.vertexAttribIPointer(3, 2, gl.UNSIGNED_BYTE, STRIDE, 24)
    return vao
  }

  /** This frame's cars, people and lights, streamed into the one dynamic buffer. */
  private uploadEntities(game: Game | null): GpuChunk {
    const { gl } = this
    this.entities.reset()
    if (game !== null) drawEntities(this.entities, game, this.tex.boxes)
    const mesh = this.entities.finish()
    gl.bindVertexArray(this.dynamic.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamic.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STREAM_DRAW)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STREAM_DRAW)
    gl.bindVertexArray(null)
    return { vao: this.dynamic.vao, opaque: mesh.opaque, shadow: mesh.shadow }
  }
}

/** The world canvas's WebGL2 context, with the multisampling alpha-to-coverage needs and a stencil for shadows. */
export const openGl = (canvas: HTMLCanvasElement): WebGL2RenderingContext | null =>
  canvas.getContext("webgl2", { alpha: false, antialias: true, depth: true, stencil: true, powerPreference: "high-performance" })
