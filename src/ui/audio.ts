/**
 * Procedural sound with WebAudio, no files: an engine hum that rises with
 * speed, a two-tone horn, and a siren that swells as police cars close in.
 * Browsers only start audio after a key press, so nothing plays before one.
 */

export type SoundState = {
  /** Car speed in m/s; the engine is silent on foot. */
  readonly speed: number
  readonly inCar: boolean
  readonly horn: boolean
  /** 0 (no police near) … 1 (right behind you). */
  readonly siren: number
}

type Voice = { readonly gain: GainNode; readonly oscs: ReadonlyArray<OscillatorNode> }

/** Engine pitch at a standstill and per m/s. */
const IDLE_HZ = 38
const HZ_PER_MS = 3.2

export class GameAudio {
  private ctx: AudioContext | null = null
  private engine: (Voice & { readonly filter: BiquadFilterNode }) | null = null
  private horn: Voice | null = null
  private siren: Voice | null = null

  /** Call from a key press: creates the audio graph the first time. */
  start(): void {
    if (this.ctx !== null) {
      if (this.ctx.state === "suspended") void this.ctx.resume()
      return
    }
    const ctx = new AudioContext()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
    const voice = (types: ReadonlyArray<readonly [OscillatorType, number]>, into: AudioNode): Voice => {
      const gain = ctx.createGain()
      gain.gain.value = 0
      gain.connect(into)
      const oscs = types.map(([type, hz]) => {
        const o = ctx.createOscillator()
        o.type = type
        o.frequency.value = hz
        o.connect(gain)
        o.start()
        return o
      })
      return { gain, oscs }
    }
    // Two detuned saws through a low-pass: a rough four-cylinder hum.
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 400
    filter.connect(master)
    this.engine = { ...voice([["sawtooth", IDLE_HZ], ["sawtooth", IDLE_HZ * 1.01]], filter), filter }
    this.horn = voice([["square", 415], ["square", 494]], master)
    this.siren = voice([["square", 700]], master)
  }

  update(s: SoundState): void {
    const { ctx, engine, horn, siren } = this
    if (ctx === null || engine === null || horn === null || siren === null) return
    const now = ctx.currentTime
    const hz = IDLE_HZ + Math.abs(s.speed) * HZ_PER_MS
    engine.oscs.forEach((o, i) => o.frequency.setTargetAtTime(hz * (i === 0 ? 1 : 1.01), now, 0.05))
    engine.filter.frequency.setTargetAtTime(300 + Math.abs(s.speed) * 40, now, 0.05)
    engine.gain.gain.setTargetAtTime(s.inCar ? 0.09 : 0, now, 0.08)
    horn.gain.gain.setTargetAtTime(s.horn ? 0.05 : 0, now, 0.01)
    // German "Martinshorn": two tones, swapping every half second.
    const tone = Math.floor(now * 2) % 2 === 0 ? 466 : 622
    siren.oscs.forEach((o) => o.frequency.setTargetAtTime(tone, now, 0.01))
    siren.gain.gain.setTargetAtTime(0.035 * s.siren, now, 0.1)
  }

  dispose(): void {
    void this.ctx?.close()
    this.ctx = null
  }
}
