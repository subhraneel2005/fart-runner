import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  AdditiveBlending,
  DoubleSide,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
} from 'three'
import { runtime } from './runtime'

export function NuclearBlast() {
  const ringA = useRef<Mesh>(null)
  const ringB = useRef<Mesh>(null)
  const core = useRef<Mesh>(null)
  const light = useRef<PointLight>(null)
  const time = useRef(0)
  const x = useRef(runtime.playerX)

  useFrame((_state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    time.current += dt
    const t = Math.min(1, time.current / 1.15)

    if (ringA.current) {
      const scale = 1 + t * 21
      ringA.current.scale.setScalar(scale)
      const material = ringA.current.material as MeshBasicMaterial
      material.opacity = Math.max(0, (1 - t) * 0.85)
    }

    if (ringB.current) {
      const t2 = Math.max(0, Math.min(1, (time.current - 0.12) / 1.25))
      ringB.current.scale.setScalar(1 + t2 * 29)
      const material = ringB.current.material as MeshBasicMaterial
      material.opacity = Math.max(0, (1 - t2) * 0.45)
    }

    if (core.current) {
      const t3 = Math.min(1, time.current / 0.6)
      core.current.scale.setScalar(1 + t3 * 4.5)
      const material = core.current.material as MeshBasicMaterial
      material.opacity = Math.max(0, (1 - t3) * 0.35)
    }

    if (light.current) {
      light.current.intensity = Math.max(0, 90 * (1 - t))
    }
  })

  return (
    <group position={[x.current, 0, 0]}>
      <mesh ref={ringA} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.82, 1.18, 72]} />
        <meshBasicMaterial
          color="#d9ff6a"
          transparent
          opacity={0.85}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ringB} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[0.88, 1.06, 72]} />
        <meshBasicMaterial
          color="#63f4ff"
          transparent
          opacity={0.45}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={core} position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.8, 24, 18]} />
        <meshBasicMaterial
          color="#eaffb0"
          transparent
          opacity={0.35}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={light} color="#c6ff3d" intensity={90} distance={34} position={[0, 1.4, 0]} />
    </group>
  )
}
