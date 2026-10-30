import { create } from 'zustand'
import { CONFIG } from '../config'
import { runtime } from '../game/runtime'
import { isMuted, setMuted } from '../lib/audio'
import { pickHeadline } from '../lib/headlines'
import { input } from '../lib/input'
import type {
  BeanEntity,
  HudSnapshot,
  ObstacleEntity,
  Phase,
  PowerUpEntity,
  PowerUpType,
  Profile,
} from '../types'

const BEST_KEY = 'fart-runner-best'
const MUTE_KEY = 'fart-runner-muted'

let idCounter = 1
export function nextEntityId() {
  return idCounter++
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0)
  } catch {
    return 0
  }
}

function readMuted() {
  try {
    const stored = localStorage.getItem(MUTE_KEY)
    if (stored !== null) return stored === '1'
  } catch {
    /* ignore */
  }
  return isMuted()
}

export function scoreOf(distance: number, beans: number, bonus: number) {
  return Math.floor(distance) + beans * CONFIG.beanScore + bonus
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

interface GameStore extends HudSnapshot {
  phase: Phase
  profile: Profile | null
  runId: number
  beansCollected: number
  bonus: number
  best: number
  headline: string
  toast: string | null
  toastId: number
  flashId: number
  nukeId: number
  muted: boolean
  obstacles: ObstacleEntity[]
  beans: BeanEntity[]
  powerups: PowerUpEntity[]

  startRun: (profile: Profile) => void
  restart: () => void
  goHome: () => void
  pause: () => void
  resume: () => void
  togglePause: () => void
  gameOver: () => void
  setHud: (hud: Partial<HudSnapshot>) => void

  addObstacles: (items: ObstacleEntity[]) => void
  removeObstacle: (id: number) => void
  clearObstacles: () => void
  addBeans: (items: BeanEntity[]) => void
  removeBean: (id: number) => void
  collectBean: (id: number) => void
  addPowerUpEntity: (item: PowerUpEntity) => void
  removePowerUp: (id: number) => void
  activatePowerUp: (type: PowerUpType) => void

  flash: () => void
  showToast: (message: string) => void
  toggleMuted: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'landing',
  profile: null,
  runId: 0,
  distance: 0,
  gas: CONFIG.gasMax,
  charge: 0,
  boosting: false,
  rocketLeft: 0,
  antigravLeft: 0,
  beansCollected: 0,
  bonus: 0,
  best: readBest(),
  headline: '',
  toast: null,
  toastId: 0,
  flashId: 0,
  nukeId: 0,
  muted: readMuted(),
  obstacles: [],
  beans: [],
  powerups: [],

  startRun: (profile) => {
    runtime.reset()
    input.reset()
    set({
      phase: 'playing',
      profile,
      runId: get().runId + 1,
      distance: 0,
      gas: CONFIG.gasMax,
      charge: 0,
      boosting: false,
      rocketLeft: 0,
      antigravLeft: 0,
      beansCollected: 0,
      bonus: 0,
      headline: '',
      toast: null,
      nukeId: 0,
      obstacles: [],
      beans: [],
      powerups: [],
    })
  },

  restart: () => {
    const profile = get().profile
    if (!profile) return
    get().startRun(profile)
  },

  goHome: () => {
    runtime.stop()
    input.reset()
    set({
      phase: 'landing',
      profile: null,
      distance: 0,
      gas: CONFIG.gasMax,
      charge: 0,
      boosting: false,
      rocketLeft: 0,
      antigravLeft: 0,
      beansCollected: 0,
      bonus: 0,
      headline: '',
      toast: null,
      nukeId: 0,
      obstacles: [],
      beans: [],
      powerups: [],
    })
  },

  pause: () => {
    if (get().phase !== 'playing') return
    runtime.stop()
    input.reset()
    set({ phase: 'paused', charge: 0, boosting: false })
  },

  resume: () => {
    if (get().phase !== 'paused') return
    runtime.running = true
    input.reset()
    set({ phase: 'playing' })
  },

  togglePause: () => {
    if (get().phase === 'playing') get().pause()
    else if (get().phase === 'paused') get().resume()
  },

  gameOver: () => {
    if (get().phase !== 'playing') return
    const state = get()
    runtime.stop()
    input.reset()
    const distance = Math.floor(runtime.distance)
    const score = scoreOf(runtime.distance, state.beansCollected, state.bonus)
    const best = Math.max(state.best, score)
    try {
      localStorage.setItem(BEST_KEY, String(best))
    } catch {
      /* ignore */
    }
    const profile = state.profile
    const headline = pickHeadline({
      name: profile?.name || 'The Unknown Tooter',
      username: profile?.username || 'mystery_farter',
      distance,
      beans: state.beansCollected,
      score,
    })
    set({
      phase: 'gameover',
      distance,
      best,
      headline,
      gas: runtime.gas,
      boosting: false,
      charge: 0,
    })
  },

  setHud: (hud) => set(hud),

  addObstacles: (items) => set((state) => ({ obstacles: [...state.obstacles, ...items] })),
  removeObstacle: (id) => set((state) => ({ obstacles: state.obstacles.filter((item) => item.id !== id) })),
  clearObstacles: () => set({ obstacles: [] }),

  addBeans: (items) => set((state) => ({ beans: [...state.beans, ...items] })),
  removeBean: (id) => set((state) => ({ beans: state.beans.filter((item) => item.id !== id) })),
  collectBean: (id) => {
    const existing = get().beans.some((item) => item.id === id)
    if (!existing) return
    runtime.gas = Math.min(CONFIG.gasMax, runtime.gas + CONFIG.beanGas)
    set((state) => ({
      beans: state.beans.filter((item) => item.id !== id),
      beansCollected: state.beansCollected + 1,
    }))
  },

  addPowerUpEntity: (item) => set((state) => ({ powerups: [...state.powerups, item] })),
  removePowerUp: (id) => set((state) => ({ powerups: state.powerups.filter((item) => item.id !== id) })),

  activatePowerUp: (type) => {
    if (type === 'rocket') {
      runtime.rocketUntil = runtime.time + CONFIG.rocketDuration
      get().showToast('FART ROCKET — hold on to your socks')
      get().flash()
    } else if (type === 'antigrav') {
      runtime.antigravUntil = runtime.time + CONFIG.antigravDuration
      get().showToast('ANTI-GRAVITY GAS — float like a bean')
      get().flash()
    } else {
      runtime.nukeUntil = runtime.time + CONFIG.nuclearInvincibility
      runtime.impulse = Math.max(runtime.impulse, CONFIG.nuclearImpulse)
      runtime.gas = CONFIG.gasMax
      runtime.fartPower = 2
      set((state) => ({
        bonus: state.bonus + CONFIG.nuclearScore,
        obstacles: [],
        nukeId: state.nukeId + 1,
      }))
      get().showToast(`NUCLEAR FART — total annihilation, +${CONFIG.nuclearScore}`)
      get().flash()
    }
  },

  flash: () => set((state) => ({ flashId: state.flashId + 1 })),

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer)
    const id = get().toastId + 1
    set({ toast: message, toastId: id })
    toastTimer = setTimeout(() => {
      if (useGameStore.getState().toastId === id) {
        useGameStore.setState({ toast: null })
      }
    }, 2600)
  },

  toggleMuted: () => {
    const next = !get().muted
    setMuted(next)
    set({ muted: next })
  },
}))
