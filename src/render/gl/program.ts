/** Compile and link a GLSL ES 3.00 program and look up its uniforms once. */
export type Program<U extends string> = { readonly program: WebGLProgram; readonly uniforms: Readonly<Record<U, WebGLUniformLocation | null>> }

const shader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
  const s = gl.createShader(type)
  if (s === null) throw new Error("WebGL gave no shader (context lost?)")
  gl.shaderSource(s, source)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`shader did not compile: ${gl.getShaderInfoLog(s) ?? ""}`)
  return s
}

export const program = <U extends string>(gl: WebGL2RenderingContext, vertex: string, fragment: string, names: ReadonlyArray<U>): Program<U> => {
  const p = gl.createProgram()
  const vs = shader(gl, gl.VERTEX_SHADER, vertex)
  const fs = shader(gl, gl.FRAGMENT_SHADER, fragment)
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`program did not link: ${gl.getProgramInfoLog(p) ?? ""}`)
  const uniforms = Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(p, name)]))
  // Every name of U was looked up above.
  return { program: p, uniforms: uniforms as Record<U, WebGLUniformLocation | null> }
}
