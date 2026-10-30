import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Object3D, type InstancedMesh } from 'three'
import { runtime } from '../runtime'

const DASHES_PER_LANE = 46
const DASH_SPACING = 5
const DASH_WRAP = DASHES_PER_LANE * DASH_SPACING

export function Road() {
  const dashes = useMemo(
    () =>
      Array.from({ length: DASHES_PER_LANE * 2 }, (_, index) => ({
        x: index < DASHES_PER_LANE ? -1.1 : 1.1,
        z: 12 - (index % DASHES_PER_LANE) * DASH_SPACING,
      })),
    [],
  )
  const dashRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useFrame((_state, rawDelta) => {
    if (runtime.running) {
      const step = runtime.speed * Math.min(rawDelta, 0.05)
      for (const dash of dashes) {
        dash.z += step
        if (dash.z > 12) dash.z -= DASH_WRAP
      }
    }

    const mesh = dashRef.current
    if (!mesh) return
    for (let i = 0; i < dashes.length; i += 1) {
      dummy.position.set(dashes[i].x, 0.032, dashes[i].z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, -80]}>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color="#241d2f" roughness={1} flatShading />
      </mesh>

      <mesh position={[0, -0.2, -95]}>
        <boxGeometry args={[8.2, 0.4, 240]} />
        <meshStandardMaterial color="#2a2334" roughness={0.95} metalness={0.04} flatShading />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 5.35, -0.02, -95]}>
            <boxGeometry args={[2.3, 0.28, 240]} />
            <meshStandardMaterial color="#4a4254" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[side * 4.22, 0.04, -95]}>
            <boxGeometry args={[0.22, 0.2, 240]} />
            <meshStandardMaterial color="#6e5a6a" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[side * 6.48, 0.12, -95]}>
            <boxGeometry args={[0.09, 0.08, 240]} />
            <meshStandardMaterial color="#c98a4b" roughness={0.8} flatShading />
          </mesh>
          <mesh position={[side * 3.55, 0.02, -95]}>
            <boxGeometry args={[0.09, 0.025, 228]} />
            <meshStandardMaterial
              color="#e8d6ab"
              emissive="#6b5a2e"
              emissiveIntensity={0.2}
              roughness={0.8}
              flatShading
            />
          </mesh>
        </group>
      ))}

      <instancedMesh ref={dashRef} args={[undefined, undefined, DASHES_PER_LANE * 2]} frustumCulled={false}>
        <boxGeometry args={[0.11, 0.035, 2.2]} />
        <meshStandardMaterial
          color="#f0dfb2"
          emissive="#6b5a2e"
          emissiveIntensity={0.28}
          roughness={0.8}
          flatShading
        />
      </instancedMesh>
    </group>
  )
}
