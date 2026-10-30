import { CONFIG } from '../config'

export const runtime = {
  running: false,
  time: 0,
  distance: 0,
  speed: CONFIG.baseSpeed,
  baseSpeed: CONFIG.baseSpeed,
  playerX: 0,
  playerY: CONFIG.playerY,
  grounded: true,
  runCycle: 0,
  gas: CONFIG.gasMax,
  charge: 0,
  boosting: false,
  fartPower: 0,
  impulse: 0,
  rocketUntil: 0,
  nukeUntil: 0,
  antigravUntil: 0,
  reset() {
    this.running = true
    this.time = 0
    this.distance = 0
    this.speed = CONFIG.baseSpeed
    this.baseSpeed = CONFIG.baseSpeed
    this.playerX = 0
    this.playerY = CONFIG.playerY
    this.grounded = true
    this.runCycle = 0
    this.gas = CONFIG.gasMax
    this.charge = 0
    this.boosting = false
    this.fartPower = 0
    this.impulse = 0
    this.rocketUntil = 0
    this.nukeUntil = 0
    this.antigravUntil = 0
  },
  stop() {
    this.running = false
    this.boosting = false
    this.charge = 0
    this.fartPower = 0
    this.impulse = 0
  },
}

export const fx = {
  shake: 0,
}

export function kick(amount = 1) {
  fx.shake = Math.min(2.5, fx.shake + amount)
}

export function isRocketActive() {
  return runtime.rocketUntil > runtime.time
}

export function isAntigravActive() {
  return runtime.antigravUntil > runtime.time
}

export function isInvincible() {
  return isRocketActive() || runtime.nukeUntil > runtime.time
}
