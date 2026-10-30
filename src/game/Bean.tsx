import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, type Group } from 'three'
import { CONFIG, LANES } from '../config'
import { playBean } from '../lib/audio'
import { useGameStore } from '../store/gameStore'
import type { BeanEntity } from '../types'
import { runtime } from './runtime'
import { makeGlowTexture } from './textures'

type RapierBody = RapierRigidBody

export function Bean({ entity }: { entity: BeanEntity }) {
  const body = useRef<RapierBody>(null)
  const spin = useRef<Group>(null)
  const z = useRef(entity.z)
  const removeBean = useGameStore((state) => state.removeBean)
  const collectBean = useGameStore((state) => state.collectBean)
  const glow = useMemo(() => makeGlowTexture('lime'), [])

  useFrame((_state, rawDelta) => {
    if (!runtime.running) return
    const dt = Math.min(rawDelta, 0.05)
    z.current += runtime.speed * dt
    if (z.current > CONFIG.despawnZ) {
      removeBean(entity.id)
      return
    }
    body.current?.setNextKinematicTranslation({ x: LANES[entity.lane], y: 0, z: z.current })
    if (spin.current) {
      spin.current.rotation.y += dt * 3.4
      spin.current.rotation.z = Math.sin(runtime.time * 3 + entity.id) * 0.3
    }
  })

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      name={`bean:${entity.id}`}
      position={[LANES[entity.lane], 0, entity.z]}
      colliders={false}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBodyObject?.name !== 'player') return
        collectBean(entity.id)
        playBean()
      }}
    >
      <BallCollider args={[0.62]} position={[0, 0.92, 0]} sensor />
      <group ref={spin} position={[0, 0.92, 0]}>
        <mesh scale={[0.24, 0.31, 0.24]}>
          <sphereGeometry args={[1, 16, 14]} />
          <meshStandardMaterial
            color="#c6ff3d"
            emissive="#7dff2e"
            emissiveIntensity={1.6}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.3, 0.02, 8, 24]} />
          <meshBasicMaterial color="#eaffb0" transparent opacity={0.7} toneMapped={false} />
        </mesh>
        {glow && (
          <sprite scale={[1.7, 1.7, 1.7]}>
            <spriteMaterial
              map={glow}
              transparent
              opacity={0.55}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </sprite>
        )}
      </group>
    </RigidBody>
  )
}
