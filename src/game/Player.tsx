import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier'
import { useRef } from 'react'
import * as THREE from 'three'
import { CONFIG, LANES } from '../config'
import { playAirFart, playBigFart, playFart, playHit, playJump } from '../lib/audio'
import { input } from '../lib/input'
import { useGameStore } from '../store/gameStore'
import { isAntigravActive, isInvincible, isRocketActive, kick, runtime } from './runtime'
import { CharacterModel } from './CharacterModel'
import { useAvatarTexture } from './useAvatarTexture'

type RapierBody = RapierRigidBody

export function Player() {
  const profile = useGameStore((state) => state.profile)
  const gameOver = useGameStore((state) => state.gameOver)
  const removeObstacle = useGameStore((state) => state.removeObstacle)
  const flash = useGameStore((state) => state.flash)

  const avatarTexture = useAvatarTexture(profile?.avatarUrl ?? null, profile?.username ?? 'mystery')

  const body = useRef<RapierBody>(null)
  const visual = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const flipGroup = useRef<THREE.Group>(null)

  const lane = useRef(1)
  const grounded = useRef(true)
  const coyote = useRef(0.12)
  const charging = useRef(false)
  const airFarts = useRef(0)
  const gravityScale = useRef(1)
  const boostTimer = useRef(0)
  const runCycle = useRef(0)
  const flipTimer = useRef(0)
  const flipDuration = 0.72

  useFrame((_state, rawDelta) => {
    const rb = body.current
    if (!rb) return
    const dt = Math.min(rawDelta, 0.05)
    const position = rb.translation()
    runtime.playerX = position.x
    runtime.playerY = position.y

    if (!runtime.running) {
      charging.current = false
      runtime.charge = 0
      runtime.boosting = false
      return
    }

    const velocity = rb.linvel()
    coyote.current = Math.max(0, coyote.current - dt)
    boostTimer.current = Math.max(0, boostTimer.current - dt)

    for (const command of input.drain()) {
      if (command === 'left') lane.current = Math.max(0, lane.current - 1)
      else if (command === 'right') lane.current = Math.min(LANES.length - 1, lane.current + 1)
      else if (command === 'jumpPress') {
        if (!grounded.current && coyote.current <= 0) {
          if (runtime.gas >= CONFIG.airFartCost && airFarts.current < CONFIG.airFartsPerJump) {
            airFarts.current += 1
            runtime.gas = Math.max(0, runtime.gas - CONFIG.airFartCost)
            const live = rb.linvel()
            rb.setLinvel(
              { x: live.x, y: Math.max(live.y, 0) + CONFIG.airFartVelocity, z: 0 },
              true,
            )
            runtime.fartPower = 1
            runtime.impulse = Math.max(runtime.impulse, 0.45)
            flipTimer.current = flipDuration
            playAirFart()
            kick(0.18)
          }
        } else {
          charging.current = true
        }
      } else if (command === 'jumpRelease') {
        if (!charging.current) continue
        charging.current = false
        const charge = runtime.charge
        runtime.charge = 0
        if (grounded.current || coyote.current > 0) {
          const cost = CONFIG.jumpCost + charge * CONFIG.jumpCostBonus
          const strength = runtime.gas >= cost ? 1 : 0.45
          runtime.gas = Math.max(0, runtime.gas - cost * strength)
          const jump = (CONFIG.jumpBase + charge * CONFIG.jumpChargeBonus) * strength
          rb.setLinvel({ x: velocity.x, y: jump, z: 0 }, true)
          grounded.current = false
          coyote.current = 0
          airFarts.current = 0
          runtime.fartPower = 1
          runtime.impulse = Math.max(runtime.impulse, 0.35 + charge * 0.65)
          if (charge >= 0.55) playBigFart(0.8 + charge * 0.4)
          else playJump()
          kick(0.1 + charge * 0.2)
        }
      }
    }

    if (charging.current) {
      if (!grounded.current && coyote.current <= 0) {
        charging.current = false
        runtime.charge = 0
      } else {
        runtime.charge = Math.min(1, runtime.charge + dt / CONFIG.chargeTime)
        runtime.fartPower = Math.max(runtime.fartPower, 0.3)
      }
    } else {
      runtime.charge = Math.max(0, runtime.charge - dt * 4)
    }

    const canBoost = input.boost && (runtime.boosting ? runtime.gas > 0.2 : runtime.gas > 8)
    const wantBoost = canBoost
    runtime.boosting = wantBoost
    if (wantBoost) {
      runtime.gas = Math.max(0, runtime.gas - dt * CONFIG.boostDrain)
      runtime.fartPower = Math.max(runtime.fartPower, 0.9)
      if (boostTimer.current <= 0) {
        boostTimer.current = 0.42
        playFart(0.3)
      }
    } else if (!charging.current) {
      runtime.gas = Math.min(CONFIG.gasMax, runtime.gas + dt * CONFIG.gasRegen)
    }

    if (isRocketActive()) runtime.fartPower = Math.max(runtime.fartPower, 0.7)

    const antigrav = isAntigravActive()
    const nextGravity = antigrav ? CONFIG.antigravGravityScale : 1
    if (nextGravity !== gravityScale.current) {
      gravityScale.current = nextGravity
      rb.setGravityScale(nextGravity, true)
    }

    const dx = LANES[lane.current] - position.x
    const vx = THREE.MathUtils.clamp(dx * CONFIG.laneLerp, -17, 17)
    const liveVelocity = rb.linvel()
    rb.setLinvel({ x: vx, y: liveVelocity.y, z: 0 }, true)

    if (position.y < -6) {
      gameOver()
      return
    }

    const airHeight = Math.max(0, position.y - CONFIG.playerY)
    runCycle.current += dt * (runtime.speed * 1.05 + 6)
    runtime.grounded = grounded.current
    runtime.runCycle = runCycle.current

    if (visual.current) {
      const targetLean = THREE.MathUtils.clamp(-dx * 0.09, -0.32, 0.32)
      visual.current.rotation.z += (targetLean - visual.current.rotation.z) * Math.min(1, dt * 9)
      const targetPitch = runtime.boosting ? -0.075 : -0.035
      visual.current.rotation.x += (targetPitch - visual.current.rotation.x) * Math.min(1, dt * 7)
      const crouch = charging.current ? runtime.charge * 0.16 : 0
      visual.current.scale.set(1 + crouch * 0.5, 1 - crouch, 1 + crouch * 0.5)
      visual.current.position.y =
        (grounded.current ? Math.abs(Math.sin(runCycle.current * 1.35)) * 0.055 : 0) - crouch * 0.08
    }

    if (flipGroup.current) {
      if (flipTimer.current > 0) {
        flipTimer.current = Math.max(0, flipTimer.current - dt)
        const progress = 1 - flipTimer.current / flipDuration
        const eased = progress * progress * (3 - 2 * progress)
        flipGroup.current.rotation.x = eased * Math.PI * 2
      } else {
        flipGroup.current.rotation.x = 0
      }
    }

    if (shadow.current) {
      shadow.current.position.y = 0.028 - position.y
      const scale = 1 - THREE.MathUtils.clamp(airHeight * 0.16, 0, 0.5)
      shadow.current.scale.setScalar(scale)
    }
  })

  return (
    <RigidBody
      ref={body}
      name="player"
      position={[0, CONFIG.playerY, 0]}
      colliders={false}
      lockRotations
      ccd
      canSleep={false}
      onCollisionEnter={({ other }) => {
        const name = other.rigidBodyObject?.name ?? ''
        if (name === 'ground') {
          grounded.current = true
          airFarts.current = 0
          return
        }
        if (!name.startsWith('obstacle:')) return
        if (isInvincible()) {
          const id = Number(name.split(':')[1])
          if (Number.isFinite(id)) removeObstacle(id)
          playFart(0.4)
          kick(0.45)
          return
        }
        playHit()
        kick(2.6)
        flash()
        gameOver()
      }}
      onCollisionExit={({ other }) => {
        if (other.rigidBodyObject?.name === 'ground') {
          grounded.current = false
          coyote.current = 0.12
        }
      }}
    >
      <CapsuleCollider
        args={[0.45, CONFIG.playerHalfWidth]}
        position={[0, 0, 0]}
        friction={0.2}
        restitution={0}
      />

      <group ref={visual}>
        <group ref={flipGroup}>
          <CharacterModel avatarTexture={avatarTexture} />
        </group>
        <Html
          position={[0, 1.56, 0]}
          center
          zIndexRange={[8, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="player-tag">@{profile?.username ?? 'mystery_farter'}</div>
        </Html>
      </group>

      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.78, 0]}>
        <circleGeometry args={[0.58, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.34} depthWrite={false} />
      </mesh>
    </RigidBody>
  )
}
