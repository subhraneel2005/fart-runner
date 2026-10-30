import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, type Group } from 'three'
import { CONFIG, LANES } from '../config'
import { playBigFart, playNuke, playPower } from '../lib/audio'
import { useGameStore } from '../store/gameStore'
import type { PowerUpEntity } from '../types'
import { kick, runtime } from './runtime'
import { makeGlowTexture, makeRadiationTexture } from './textures'

type RapierBody = RapierRigidBody

export function PowerUp({ entity }: { entity: PowerUpEntity }) {
  const body = useRef<RapierBody>(null)
  const visual = useRef<Group>(null)
  const z = useRef(entity.z)
  const consumed = useRef(false)
  const removePowerUp = useGameStore((state) => state.removePowerUp)
  const activatePowerUp = useGameStore((state) => state.activatePowerUp)
  const glow = useMemo(
    () => makeGlowTexture(entity.type === 'antigrav' ? 'cyan' : 'orange'),
    [entity.type],
  )
  const radiation = useMemo(
    () => (entity.type === 'nuclear' ? makeRadiationTexture() : null),
    [entity.type],
  )
  const baseY = entity.type === 'antigrav' ? 1.35 : 1.15

  useFrame((_state, rawDelta) => {
    if (!runtime.running) return
    const dt = Math.min(rawDelta, 0.05)
    z.current += runtime.speed * dt
    if (z.current > CONFIG.despawnZ) {
      removePowerUp(entity.id)
      return
    }
    body.current?.setNextKinematicTranslation({ x: LANES[entity.lane], y: 0, z: z.current })
    if (visual.current) {
      visual.current.rotation.y += dt * 1.8
      visual.current.position.y = baseY + Math.sin(runtime.time * 3.2 + entity.id) * 0.14
    }
  })

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      name={`powerup:${entity.id}`}
      position={[LANES[entity.lane], 0, entity.z]}
      colliders={false}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBodyObject?.name !== 'player' || consumed.current) return
        consumed.current = true
        activatePowerUp(entity.type)
        removePowerUp(entity.id)
        if (entity.type === 'nuclear') {
          playBigFart(1.35)
          playNuke()
          kick(2.5)
        } else {
          playPower()
          kick(0.4)
        }
      }}
    >
      <BallCollider args={[0.9]} position={[0, baseY, 0]} sensor />

      <group ref={visual} position={[0, baseY, 0]}>
        {entity.type === 'rocket' && (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.19, 0.22, 0.85, 16]} />
              <meshStandardMaterial
                color="#ff8a3d"
                emissive="#ff5a1f"
                emissiveIntensity={0.9}
                metalness={0.5}
                roughness={0.3}
                flatShading
              />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <coneGeometry args={[0.19, 0.34, 16]} />
              <meshStandardMaterial
                color="#f4ffef"
                emissive="#c6ff3d"
                emissiveIntensity={1.1}
                metalness={0.3}
                flatShading
              />
            </mesh>
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
              <mesh key={angle} position={[Math.cos(angle) * 0.22, -0.34, Math.sin(angle) * 0.22]}>
                <boxGeometry args={[0.18, 0.24, 0.05]} />
                <meshStandardMaterial color="#ff3550" emissive="#ff3550" emissiveIntensity={0.8} flatShading />
              </mesh>
            ))}
          </group>
        )}

        {entity.type === 'nuclear' && (
          <group rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <capsuleGeometry args={[0.27, 0.55, 8, 18]} />
              <meshStandardMaterial
                color="#ffd23d"
                emissive="#b6ff4d"
                emissiveIntensity={0.9}
                roughness={0.35}
                flatShading
              />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.3, 0.04, 8, 24]} />
              <meshStandardMaterial color="#2f3d2a" emissive="#8bff3d" emissiveIntensity={1.4} flatShading />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color="#8bff3d" emissive="#8bff3d" emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
            {radiation && (
              <sprite scale={[1.35, 1.35, 1.35]} position={[0, 0, 0.34]}>
                <spriteMaterial
                  map={radiation}
                  transparent
                  opacity={0.95}
                  depthWrite={false}
                  blending={AdditiveBlending}
                  toneMapped={false}
                />
              </sprite>
            )}
          </group>
        )}

        {entity.type === 'antigrav' && (
          <group>
            <mesh>
              <icosahedronGeometry args={[0.48, 0]} />
              <meshStandardMaterial
                color="#63f4ff"
                emissive="#31c6dd"
                emissiveIntensity={0.9}
                wireframe
                transparent
                opacity={0.9}
                flatShading
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.3, 18, 14]} />
              <meshStandardMaterial
                color="#c9fbff"
                emissive="#63f4ff"
                emissiveIntensity={1.4}
                transparent
                opacity={0.55}
                flatShading
              />
            </mesh>
          </group>
        )}

        {glow && (
          <sprite scale={[3.1, 3.1, 3.1]}>
            <spriteMaterial
              map={glow}
              transparent
              opacity={0.5}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </sprite>
        )}
      </group>
    </RigidBody>
  )
}
