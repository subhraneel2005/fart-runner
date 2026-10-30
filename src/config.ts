export const LANES = [-2.2, 0, 2.2] as const
export const LANE_COUNT = LANES.length

export const CONFIG = {
  baseSpeed: 13.5,
  speedRamp: 0.011,
  maxSpeed: 32,
  laneLerp: 14,

  gravity: 26,
  jumpBase: 9.4,
  jumpChargeBonus: 5.2,
  chargeTime: 0.7,
  jumpCost: 12,
  jumpCostBonus: 18,
  airFartCost: 16,
  airFartVelocity: 5.6,
  airFartsPerJump: 3,

  gasMax: 100,
  gasRegen: 9,
  boostDrain: 24,
  boostMul: 1.45,

  rocketMul: 1.7,
  rocketDuration: 6,
  antigravDuration: 8,
  antigravGravityScale: 0.22,

  spawnZ: -145,
  despawnZ: 16,
  beanGas: 6,
  beanScore: 10,
  nuclearScore: 500,
  nuclearInvincibility: 1.6,
  nuclearImpulse: 1.4,

  playerY: 0.84,
  playerHalfHeight: 0.8,
  playerHalfWidth: 0.35,
}

export const OBSTACLES = {
  crate: { width: 1.7, height: 1.15, depth: 1.3, y: 0.575 },
  hurdle: { width: 1.9, height: 0.9, depth: 0.55, y: 0.45 },
  barrier: { width: 2.0, height: 2.6, depth: 0.55, y: 1.3 },
} as const

export type ObstacleKind = keyof typeof OBSTACLES
