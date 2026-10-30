import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CONFIG, LANES, OBSTACLES } from '../config'
import { useGameStore } from '../store/gameStore'
import type { ObstacleEntity } from '../types'
import { runtime } from './runtime'
import { makeSignTexture } from './textures'

type RapierBody = RapierRigidBody

export function Obstacle({ entity }: { entity: ObstacleEntity }) {
  const body = useRef<RapierBody>(null)
  const z = useRef(entity.z)
  const removeObstacle = useGameStore((state) => state.removeObstacle)
  const definition = OBSTACLES[entity.type]
  const sign = useMemo(() => {
    if (entity.type === 'crate') return makeSignTexture('BEANS\nINSIDE', '#ffb03d', '#26160a')
    if (entity.type === 'barrier') return makeSignTexture('NO\nFARTING', '#ff3550', '#14070a')
    return null
  }, [entity.type])

  useFrame((_state, rawDelta) => {
    if (!runtime.running) return
    const dt = Math.min(rawDelta, 0.05)
    z.current += runtime.speed * dt
    if (z.current > CONFIG.despawnZ) {
      removeObstacle(entity.id)
      return
    }
    body.current?.setNextKinematicTranslation({
      x: LANES[entity.lane],
      y: 0,
      z: z.current,
    })
  })

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      name={`obstacle:${entity.id}`}
      position={[LANES[entity.lane], 0, entity.z]}
      colliders={false}
      ccd
    >
      <CuboidCollider
        args={[definition.width / 2, definition.height / 2, definition.depth / 2]}
        position={[0, definition.y, 0]}
        friction={0.4}
      />

      {entity.type === 'crate' && (
        <group>
          <mesh position={[0, definition.y, 0]} castShadow>
            <boxGeometry args={[definition.width, definition.height, definition.depth]} />
            <meshStandardMaterial color="#9a6330" roughness={0.8} metalness={0.08} flatShading />
          </mesh>
          <mesh position={[0, definition.y, definition.depth / 2 + 0.01]}>
            <boxGeometry args={[definition.width * 0.92, definition.height * 0.7, 0.02]} />
            <meshStandardMaterial color="#6e441f" roughness={0.9} flatShading />
          </mesh>
          {sign && (
            <mesh position={[0, definition.y + 0.1, definition.depth / 2 + 0.025]}>
              <planeGeometry args={[definition.width * 0.8, definition.height * 0.5]} />
              <meshBasicMaterial map={sign} toneMapped={false} />
            </mesh>
          )}
          <mesh position={[0, definition.height + 0.03, 0]}>
            <boxGeometry args={[definition.width * 0.9, 0.06, definition.depth * 0.9]} />
            <meshStandardMaterial color="#ff8a3d" emissive="#ff6a1f" emissiveIntensity={0.8} flatShading />
          </mesh>
        </group>
      )}

      {entity.type === 'hurdle' && (
        <group>
          {[-0.62, 0.62].map((x) => (
            <mesh key={x} position={[x, 0.42, 0]}>
              <boxGeometry args={[0.12, 0.84, 0.12]} />
              <meshStandardMaterial color="#2e3a34" roughness={0.6} metalness={0.4} flatShading />
            </mesh>
          ))}
          <mesh position={[0, 0.86, 0]}>
            <boxGeometry args={[definition.width, 0.2, 0.2]} />
            <meshStandardMaterial color="#ffcf3d" emissive="#ff9a1f" emissiveIntensity={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.64, 0]}>
            <boxGeometry args={[definition.width * 0.94, 0.12, 0.24]} />
            <meshStandardMaterial color="#ff3550" emissive="#ff3550" emissiveIntensity={1.3} toneMapped={false} flatShading />
          </mesh>
        </group>
      )}

      {entity.type === 'barrier' && (
        <group>
          <mesh position={[0, definition.y, 0]}>
            <boxGeometry args={[definition.width, definition.height, definition.depth]} />
            <meshStandardMaterial color="#1a2326" roughness={0.55} metalness={0.5} flatShading />
          </mesh>
          {[-0.72, 0.72].map((x) => (
            <mesh key={x} position={[x, definition.y, definition.depth / 2 + 0.015]}>
              <boxGeometry args={[0.09, definition.height * 0.92, 0.03]} />
              <meshStandardMaterial
                color="#ff3550"
                emissive="#ff3550"
                emissiveIntensity={2}
                toneMapped={false}
                flatShading
              />
            </mesh>
          ))}
          {sign && (
            <mesh position={[0, definition.y, definition.depth / 2 + 0.04]}>
              <planeGeometry args={[definition.width * 0.78, definition.height * 0.42]} />
              <meshBasicMaterial map={sign} toneMapped={false} />
            </mesh>
          )}
        </group>
      )}
    </RigidBody>
  )
}
