/**
 * GPU textures: the seamless materials and the sprites, each one texture
 * array with mipmaps (one layer per image), and the paved-ground mask.
 */
import type { Assets } from "../assets.ts"
import { SPRITE_LAYERS, Sprite, type SpriteBoxes } from "../scene/mesh.ts"

const MATERIAL_PX = 512
const SPRITE_PX = 256

type Source = HTMLImageElement | HTMLCanvasElement

const canvas2d = (size: number): readonly [HTMLCanvasElement, CanvasRenderingContext2D | null] => {
  const c = document.createElement("canvas")
  c.width = size
  c.height = size
  return [c, c.getContext("2d")]
}

/** The traffic light's parts, drawn once in white so the renderer tints them: housing, lamp, glow. */
const lightParts = (): ReadonlyArray<HTMLCanvasElement> => {
  const [housing, h] = canvas2d(SPRITE_PX)
  if (h !== null) {
    h.fillStyle = "#fff"
    h.beginPath()
    h.roundRect(8, 8, SPRITE_PX - 16, SPRITE_PX - 16, 40)
    h.fill()
  }
  const [lamp, l] = canvas2d(SPRITE_PX)
  if (l !== null) {
    l.fillStyle = "#fff"
    l.beginPath()
    l.arc(SPRITE_PX / 2, SPRITE_PX / 2, SPRITE_PX / 2 - 6, 0, Math.PI * 2)
    l.fill()
  }
  const [glow, g] = canvas2d(SPRITE_PX)
  if (g !== null) {
    const r = g.createRadialGradient(SPRITE_PX / 2, SPRITE_PX / 2, 0, SPRITE_PX / 2, SPRITE_PX / 2, SPRITE_PX / 2)
    r.addColorStop(0, "rgba(255,255,255,0.75)")
    r.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = r
    g.fillRect(0, 0, SPRITE_PX, SPRITE_PX)
  }
  return [housing, lamp, glow]
}

const array = (gl: WebGL2RenderingContext, size: number, images: ReadonlyArray<Source>, wrap: number): WebGLTexture => {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex)
  const levels = Math.log2(size) + 1
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, size, size, images.length)
  const [c, ctx] = canvas2d(size)
  images.forEach((img, layer) => {
    if (ctx === null) return
    ctx.clearRect(0, 0, size, size)
    // Materials fill the layer; sprites keep their size at its top-left corner.
    if (img.width === img.height) ctx.drawImage(img, 0, 0, size, size)
    else {
      const k = size / Math.max(img.width, img.height)
      ctx.drawImage(img, 0, 0, img.width * k, img.height * k)
    }
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, size, size, 1, gl.RGBA, gl.UNSIGNED_BYTE, c)
  })
  gl.generateMipmap(gl.TEXTURE_2D_ARRAY)
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, wrap)
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, wrap)
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic")
  // Walls are seen at a slant towards the screen edges: anisotropic filtering keeps their windows sharp.
  if (aniso !== null) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8)
  return tex
}

/** The paved mask as one channel: the alpha of ground.png. */
const mask = (gl: WebGL2RenderingContext, img: HTMLImageElement): WebGLTexture => {
  const c = document.createElement("canvas")
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext("2d", { willReadFrequently: true })
  const alpha = new Uint8Array(img.width * img.height)
  if (ctx !== null) {
    ctx.drawImage(img, 0, 0)
    const px = ctx.getImageData(0, 0, img.width, img.height).data
    for (let i = 0; i < alpha.length; i++) alpha[i] = px[i * 4 + 3] ?? 0
  }
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, img.width, img.height, 0, gl.RED, gl.UNSIGNED_BYTE, alpha)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

export type Textures = {
  readonly materials: WebGLTexture
  readonly sprites: WebGLTexture
  readonly mask: WebGLTexture
  readonly maskSize: readonly [number, number]
  /** How much of its layer each sprite fills. */
  readonly boxes: SpriteBoxes
}

export const uploadTextures = (gl: WebGL2RenderingContext, assets: Assets): Textures => {
  const spriteImages: Array<Source> = [...assets.cars, ...assets.peds, ...assets.trees, ...lightParts(), ...assets.fx, ...assets.pickups, ...assets.props]
  if (spriteImages.length !== SPRITE_LAYERS || assets.cars.length !== Sprite.ped || Sprite.housing !== Sprite.tree + assets.trees.length || Sprite.pickup !== Sprite.fx + assets.fx.length || Sprite.prop !== Sprite.pickup + assets.pickups.length)
    throw new Error("sprite layers do not match the loaded sprites")
  const boxes = spriteImages.map((img): readonly [number, number] => {
    const k = 1 / Math.max(img.width, img.height)
    return [img.width * k, img.height * k]
  })
  return {
    materials: array(gl, MATERIAL_PX, assets.materials, gl.REPEAT),
    sprites: array(gl, SPRITE_PX, spriteImages, gl.CLAMP_TO_EDGE),
    mask: mask(gl, assets.ground),
    maskSize: [assets.ground.width, assets.ground.height],
    boxes,
  }
}
