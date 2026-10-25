/**
 * Procedural sound with WebAudio, no files: an engine hum that rises with
 * speed, a two-tone horn, a siren that swells as police cars close in, and
 * one-shot effects (gunshots, explosions, flames, punches, screams) shaped
 * from filtered noise and swept oscillators.
 * Browsers only start audio after a key press, so nothing plays before one.
 */
import type { Point, Sound, SoundId } from "#/sim/state.ts"

export type SoundState = {
  /** Car speed in m/s; the engine is silent on foot. */
  readonly speed: number
  readonly inCar: boolean
  readonly horn: boolean
  /** 0 (no police near) … 1 (right behind you). */
  readonly siren: number
}

type Voice = { readonly gain: GainNode; readonly oscs: ReadonlyArray<OscillatorNode> }

/** Meters within which you hear a shot or a bang, louder the closer. */
const HEARING_M = 90

/** Engine pitch at a standstill and per m/s. */
const IDLE_HZ = 38
const HZ_PER_MS = 3.2

const VOLUME = 0.5

export class GameAudio {
  private ctx: AudioContext | null = null
  private engine: (Voice & { readonly filter: BiquadFilterNode }) | null = null
  private horn: Voice | null = null
  private siren: Voice | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private muted = false

  /** Sound off (M or the speaker button): the master volume goes to zero, everything else keeps running. */
  setMuted(muted: boolean): void {
    this.muted = muted
    const { ctx, master } = this
    if (ctx !== null && master !== null) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.02)
  }

  /** Call from a key press: creates the audio graph the first time. */
  start(): void {
    if (this.ctx !== null) {
      if (this.ctx.state === "suspended") void this.ctx.resume()
      return
    }
    const ctx = new AudioContext()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : VOLUME
    master.connect(ctx.destination)
    this.master = master
    // One second of white noise, the raw stuff of every bang.
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    this.noise = noise
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

  /** This frame's sound effects, quieter the further from `listener` they happened; each kind once per frame. */
  effects(sounds: ReadonlyArray<Sound>, listener: Point): void {
    const loudest = new Map<SoundId, number>()
    for (const s of sounds) {
      const v = Math.max(0, 1 - Math.hypot(s.x - listener.x, s.y - listener.y) / HEARING_M)
      if (v > (loudest.get(s.id) ?? 0)) loudest.set(s.id, v)
    }
    for (const [id, v] of loudest) this.play(id, v)
  }

  private play(id: SoundId, volume: number): void {
    const { ctx, master, noise } = this
    if (ctx === null || master === null || noise === null || volume <= 0) return
    const now = ctx.currentTime
    /** A burst of noise through a filter, with a fast attack and an exponential fade. */
    const burst = (type: BiquadFilterType, hz: number, toHz: number, gain: number, seconds: number) => {
      const src = ctx.createBufferSource()
      src.buffer = noise
      const filter = ctx.createBiquadFilter()
      filter.type = type
      filter.frequency.setValueAtTime(hz, now)
      filter.frequency.exponentialRampToValueAtTime(toHz, now + seconds)
      const g = ctx.createGain()
      g.gain.setValueAtTime(gain * volume, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + seconds)
      src.connect(filter).connect(g).connect(master)
      src.start(now, Math.random() * 0.5, seconds + 0.05)
    }
    /** A swept tone: thumps, blips and cartoon screams. */
    const tone = (type: OscillatorType, hz: number, toHz: number, gain: number, seconds: number) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.setValueAtTime(hz, now)
      o.frequency.exponentialRampToValueAtTime(toHz, now + seconds)
      const g = ctx.createGain()
      g.gain.setValueAtTime(gain * volume, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + seconds)
      o.connect(g).connect(master)
      o.start(now)
      o.stop(now + seconds + 0.05)
    }
    if (id === "pistol" || id === "copShot") {
      burst("bandpass", id === "pistol" ? 1400 : 1100, 500, 0.5, 0.14)
      tone("sine", 160, 50, 0.35, 0.1)
    } else if (id === "smg") {
      burst("bandpass", 1800, 700, 0.32, 0.07)
      tone("sine", 140, 60, 0.2, 0.06)
    } else if (id === "shotgun") {
      burst("lowpass", 2500, 300, 0.7, 0.35)
      tone("sine", 110, 40, 0.5, 0.2)
    } else if (id === "rocket") burst("bandpass", 300, 2200, 0.35, 0.55)
    else if (id === "explosion") {
      burst("lowpass", 900, 60, 0.9, 1.4)
      tone("sine", 70, 25, 0.7, 0.8)
    } else if (id === "flame") burst("bandpass", 600, 350, 0.18, 0.14)
    else if (id === "molotov") {
      burst("highpass", 4000, 6000, 0.25, 0.12)
      burst("lowpass", 700, 200, 0.4, 0.6)
    } else if (id === "punch") {
      burst("lowpass", 500, 150, 0.45, 0.09)
      tone("sine", 120, 60, 0.3, 0.08)
    } else if (id === "ring") {
      // An old German phone bell: a fast warble of two tones.
      for (let k = 0; k < 6; k++) {
        const o = ctx.createOscillator()
        o.type = "square"
        o.frequency.value = k % 2 === 0 ? 1180 : 1420
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.04 * volume, now + k * 0.05)
        g.gain.setValueAtTime(0, now + k * 0.05 + 0.045)
        o.connect(g).connect(master)
        o.start(now + k * 0.05)
        o.stop(now + k * 0.05 + 0.05)
      }
    } else if (id === "pickup") {
      tone("square", 660, 990, 0.06, 0.18)
    } else {
      // A cartoon scream: falling, with a wobble from two detuned voices.
      tone("sawtooth", 950, 520, 0.05, 0.55)
      tone("sawtooth", 990, 560, 0.04, 0.5)
    }
  }

  dispose(): void {
    void this.ctx?.close()
    this.ctx = null
  }
}
