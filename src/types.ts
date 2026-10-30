import type { ObstacleKind } from './config'

export type Phase = 'landing' | 'playing' | 'paused' | 'gameover'
export type PowerUpType = 'rocket' | 'nuclear' | 'antigrav'

export interface Profile {
  username: string
  name: string
  avatarUrl: string | null
  isDefault: boolean
}

export interface ObstacleEntity {
  id: number
  lane: number
  type: ObstacleKind
  z: number
}

export interface BeanEntity {
  id: number
  lane: number
  z: number
}

export interface PowerUpEntity {
  id: number
  lane: number
  z: number
  type: PowerUpType
}

export interface HudSnapshot {
  distance: number
  gas: number
  charge: number
  boosting: boolean
  rocketLeft: number
  antigravLeft: number
}
