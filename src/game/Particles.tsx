import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute } from 'three'
import { useGameStore } from '../store/gameStore'
import { runtime } from './runtime'
import { makeSoftCircleTexture } from './textures'

const MAX = 180

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  r: number
  g: number
  b: number
}

export function FartParticles() {
  const particles = useRef<Particle[]>([])
  const emit = useRef(0)
  const puff = useMemo(() => makeSoftCircleTexture(), [])
  const lastNuke = useRef(useGameStore.getState().nukeId)

  const positions = useMemo(() => new Float32Array(MAX * 3), [])
  const colors = useMemo(() => new Float32Array(MAX * 3), [])
  const positionAttribute = useMemo(() => new BufferAttribute(positions, 3), [positions])
  const colorAttribute = useMemo(() => new BufferAttribute(colors, 3), [colors])

  useFrame((_state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const list = particles.current

    const nukeId = useGameStore.getState().nukeId
    if (nukeId !== lastNuke.current) {
      lastNuke.current = nukeId
      for (let i = 0; i < 130; i += 1) {
        if (list.length >= MAX) break
        const angle = Math.random() * Math.PI * 2
        const speed = 3 + Math.random() * 11
        const orange = Math.random() < 0.25
        list.push({
          x: runtime.playerX + (Math.random() - 0.5) * 0.5,
          y: runtime.playerY - 0.15 + Math.random() * 0.7,
          z: (Math.random() - 0.5) * 0.6,
          vx: Math.cos(angle) * speed,
          vy: 1 + Math.random() * 5,
          vz: Math.sin(angle) * speed,
          life: 0.7 + Math.random() * 0.8,
          maxLife: 1.5,
          r: 0.7,
          g: orange ? 0.5 : 1,
          b: orange ? 0.18 : 0.3,
        })
      }
    }

    if (runtime.running && runtime.fartPower > 0.05) {
      emit.current += dt * (30 + runtime.fartPower * 100)
      while (emit.current >= 1) {
        emit.current -= 1
        if (list.length >= MAX) break
        const brown = Math.random() < 0.28
        list.push({
          x: runtime.playerX + (Math.random() - 0.5) * 0.32,
          y: runtime.playerY - 0.05 + Math.random() * 0.22,
          z: 0.55 + Math.random() * 0.3,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 0.4 + Math.random() * 1.2,
          vz: 2.6 + Math.random() * 4.2,
          life: 0.45 + Math.random() * 0.5,
          maxLife: 0.95,
          r: brown ? 0.62 : 0.56,
          g: brown ? 0.42 : 0.95,
          b: brown ? 0.2 : 0.3,
        })
      }
    }

    let write = 0
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const particle = list[i]
      particle.life -= dt
      if (particle.life <= 0) {
        list.splice(i, 1)
        continue
      }
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.z += particle.vz * dt
      particle.vy -= 1.1 * dt
    }

    for (const particle of list) {
      const fade = Math.max(0, particle.life / particle.maxLife)
      positions[write * 3] = particle.x
      positions[write * 3 + 1] = particle.y
      positions[write * 3 + 2] = particle.z
      colors[write * 3] = particle.r * fade
      colors[write * 3 + 1] = particle.g * fade
      colors[write * 3 + 2] = particle.b * fade
      write += 1
    }

    for (let i = write; i < MAX; i += 1) {
      colors[i * 3] = 0
      colors[i * 3 + 1] = 0
      colors[i * 3 + 2] = 0
    }

    positionAttribute.needsUpdate = true
    colorAttribute.needsUpdate = true
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <primitive object={positionAttribute} attach="attributes-position" />
        <primitive object={colorAttribute} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial
        map={puff ?? undefined}
        size={0.42}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
