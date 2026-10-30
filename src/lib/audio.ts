const MUTE_KEY = 'fart-runner-muted'

const FART_SAMPLES = {
  dry: '/fart_sound_effects/dry-fart.mp3',
  big: '/fart_sound_effects/fart-with-reverb.mp3',
} as const

type FartKind = keyof typeof FART_SAMPLES

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let muted = false
let fartBuffers: Partial<Record<FartKind, AudioBuffer>> = {}
let fartLoad: Promise<void> | null = null

try {
  muted = localStorage.getItem(MUTE_KEY) === '1'
} catch {
  muted = false
}

function makeNoise(context: AudioContext) {
  if (noise) return noise
  const buffer = context.createBuffer(1, context.sampleRate * 1.2, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  noise = buffer
  return buffer
}

export function initAudio() {
  if (typeof window === 'undefined') return
  if (!ctx) {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    ctx = new AudioCtor()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.4
    master.connect(ctx.destination)
  }
  void loadFartSamples(ctx)
  if (ctx.state === 'suspended') void ctx.resume()
}

async function loadFartSamples(context: AudioContext) {
  if (fartLoad) return fartLoad
  fartLoad = Promise.all(
    (Object.entries(FART_SAMPLES) as Array<[FartKind, string]>).map(async ([kind, url]) => {
      try {
        const response = await fetch(url)
        if (!response.ok) return
        const data = await response.arrayBuffer()
        fartBuffers[kind] = await context.decodeAudioData(data)
      } catch {
        /* fall back to the synthesized fart */
      }
    }),
  ).then(() => undefined)
  return fartLoad
}

function playFartSample(kind: FartKind, strength: number) {
  const audio = ready()
  const buffer = fartBuffers[kind]
  if (!audio || !buffer) return false
  const { ctx: context, master: out } = audio
  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = kind === 'big' ? 0.97 + Math.random() * 0.08 : 0.88 + Math.random() * 0.24
  const gain = context.createGain()
  const level = Math.max(0.15, Math.min(1.4, strength))
  gain.gain.value = (kind === 'big' ? 0.95 : 0.7) * level
  source.connect(gain)
  gain.connect(out)
  source.start()
  return true
}

export function isMuted() {
  return muted
}

export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(value ? 0 : 0.4, ctx.currentTime, 0.03)
  }
}

function ready() {
  initAudio()
  return ctx && master ? { ctx, master } : null
}

function distortion(context: AudioContext, amount: number) {
  const shaper = context.createWaveShaper()
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i += 1) {
    const x = (i / 255) * 2 - 1
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x))
  }
  shaper.curve = curve
  shaper.oversample = '2x'
  return shaper
}

function synthFart(strength = 1) {
  const audio = ready()
  if (!audio) return
  const { ctx: context, master: out } = audio
  const now = context.currentTime
  const duration = 0.22 + strength * 0.26
  const base = 150 + Math.random() * 60

  const env = context.createGain()
  env.gain.setValueAtTime(0.0001, now)
  env.gain.exponentialRampToValueAtTime(0.3 + strength * 0.25, now + 0.02)
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1500, now)
  filter.frequency.exponentialRampToValueAtTime(300, now + duration)

  const osc = context.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(base, now)
  osc.frequency.exponentialRampToValueAtTime(42 + Math.random() * 26, now + duration)

  const rough = context.createBufferSource()
  rough.buffer = makeNoise(context)
  const roughFilter = context.createBiquadFilter()
  roughFilter.type = 'bandpass'
  roughFilter.frequency.value = 480 + Math.random() * 300
  roughFilter.Q.value = 0.9
  const roughGain = context.createGain()
  roughGain.gain.value = 0.5 + strength * 0.4

  osc.connect(filter)
  rough.connect(roughFilter)
  roughFilter.connect(roughGain)
  roughGain.connect(filter)
  filter.connect(distortion(context, 2.4 + strength))
  filter.connect(env)
  env.connect(out)

  osc.start(now)
  osc.stop(now + duration + 0.02)
  rough.start(now)
  rough.stop(now + duration + 0.02)
}

export function playFart(strength = 1) {
  if (playFartSample('dry', strength)) return
  synthFart(strength)
}

export function playBigFart(strength = 1) {
  if (playFartSample('big', strength)) return
  synthFart(strength)
}

export function playJump() {
  playFart(0.75)
}

export function playAirFart() {
  playFart(0.55)
}

export function playBean() {
  const audio = ready()
  if (!audio) return
  const { ctx: context, master: out } = audio
  const now = context.currentTime
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(720, now)
  osc.frequency.exponentialRampToValueAtTime(1440, now + 0.09)
  gain.gain.setValueAtTime(0.14, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
  osc.connect(gain)
  gain.connect(out)
  osc.start(now)
  osc.stop(now + 0.18)
}

export function playPower() {
  const audio = ready()
  if (!audio) return
  const { ctx: context, master: out } = audio
  const now = context.currentTime
  ;[523, 659, 784, 1046].forEach((freq, index) => {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const start = now + index * 0.07
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24)
    osc.connect(gain)
    gain.connect(out)
    osc.start(start)
    osc.stop(start + 0.26)
  })
}

export function playHit() {
  const audio = ready()
  if (!audio) return
  const { ctx: context, master: out } = audio
  const now = context.currentTime
  const buffer = makeNoise(context)
  const source = context.createBufferSource()
  source.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1200, now)
  filter.frequency.exponentialRampToValueAtTime(120, now + 0.4)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.5, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start(now)
  source.stop(now + 0.46)

  const osc = context.createOscillator()
  const oscGain = context.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(120, now)
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.4)
  oscGain.gain.setValueAtTime(0.22, now)
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
  osc.connect(oscGain)
  oscGain.connect(out)
  osc.start(now)
  osc.stop(now + 0.44)
}

export function playNuke() {
  const audio = ready()
  if (!audio) return
  const { ctx: context, master: out } = audio
  const now = context.currentTime
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(90, now)
  osc.frequency.exponentialRampToValueAtTime(24, now + 0.9)
  gain.gain.setValueAtTime(0.45, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1)
  osc.connect(gain)
  gain.connect(out)
  osc.start(now)
  osc.stop(now + 1.02)

  const buffer = makeNoise(context)
  const source = context.createBufferSource()
  source.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(900, now)
  filter.frequency.exponentialRampToValueAtTime(90, now + 0.7)
  const noiseGain = context.createGain()
  noiseGain.gain.setValueAtTime(0.4, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
  source.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(out)
  source.start(now)
  source.stop(now + 0.82)
}
