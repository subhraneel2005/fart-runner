import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { CONFIG, LANE_COUNT, LANES } from '../config'
import type { ObstacleKind } from '../config'
import { nextEntityId, useGameStore } from '../store/gameStore'
import type { BeanEntity, ObstacleEntity, PowerUpEntity, PowerUpType } from '../types'
import { runtime } from './runtime'

function shuffledLanes() {
  return [0, 1, 2].sort(() => Math.random() - 0.5)
}

function obstacleKind(distance: number): ObstacleKind {
  const barrierChance = Math.min(0.4, 0.1 + distance / 6000)
  const hurdleChance = 0.27
  const roll = Math.random()
  if (roll < barrierChance) return 'barrier'
  if (roll < barrierChance + hurdleChance) return 'hurdle'
  return 'crate'
}

function powerUpKind(): PowerUpType {
  const roll = Math.random()
  if (roll < 0.4) return 'rocket'
  if (roll < 0.72) return 'antigrav'
  return 'nuclear'
}

export function Spawner() {
  const addObstacles = useGameStore((state) => state.addObstacles)
  const addBeans = useGameStore((state) => state.addBeans)
  const addPowerUpEntity = useGameStore((state) => state.addPowerUpEntity)

  const gapLeft = useRef(4)
  const powerLeft = useRef(180)
  const seeded = useRef(false)

  function spawnRow(z: number, seed = false) {
    const distance = runtime.distance
    const lanes = shuffledLanes()
    const roll = Math.random()
    const blocked: number[] = []
    const obstacles: ObstacleEntity[] = []

    if (!seed && distance > 650 && roll < 0.06) {
      for (const lane of lanes) {
        obstacles.push({ id: nextEntityId(), lane, type: 'hurdle', z })
      }
      blocked.push(...lanes)
    } else if (roll < 0.42) {
      const lane = lanes[0]
      blocked.push(lane)
      obstacles.push({ id: nextEntityId(), lane, type: obstacleKind(distance), z })
    } else {
      blocked.push(lanes[1], lanes[2])
      obstacles.push({ id: nextEntityId(), lane: lanes[1], type: obstacleKind(distance), z })
      obstacles.push({
        id: nextEntityId(),
        lane: lanes[2],
        type: Math.random() < 0.5 ? 'hurdle' : obstacleKind(distance),
        z,
      })
    }

    addObstacles(obstacles)

    if (blocked.length >= LANE_COUNT || Math.random() > 0.62) return
    const free = LANES.map((_, index) => index).filter((lane) => !blocked.includes(lane))
    if (free.length === 0) return
    const beanLane = free[Math.floor(Math.random() * free.length)]
    const count = 3 + Math.floor(Math.random() * 3)
    const beans: BeanEntity[] = []
    for (let i = 0; i < count; i += 1) {
      beans.push({ id: nextEntityId(), lane: beanLane, z: z + 12 - i * 3.4 })
    }
    addBeans(beans)
  }

  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    spawnRow(-38, true)
    spawnRow(-68, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_state, rawDelta) => {
    if (!runtime.running) return
    const dt = Math.min(rawDelta, 0.05)
    const step = runtime.speed * dt
    gapLeft.current -= step
    powerLeft.current -= step

    if (gapLeft.current <= 0) {
      const distance = runtime.distance
      const gap = Math.max(13, 22 - distance * 0.003) + Math.random() * 6
      gapLeft.current = gap
      spawnRow(CONFIG.spawnZ)
    }

    if (powerLeft.current <= 0) {
      powerLeft.current = 240 + Math.random() * 180
      const item: PowerUpEntity = {
        id: nextEntityId(),
        lane: Math.floor(Math.random() * LANE_COUNT),
        z: CONFIG.spawnZ + 34,
        type: powerUpKind(),
      }
      addPowerUpEntity(item)
    }
  })

  return null
}
