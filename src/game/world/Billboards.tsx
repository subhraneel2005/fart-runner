import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { runtime } from '../runtime'
import { makeSignTexture } from '../textures'

const WRAP = 220

interface BillboardData {
  side: number
  z: number
  text: string
  background: string
  foreground: string
}

const BILLBOARDS: BillboardData[] = [
  { side: 1, z: -8, text: 'FART\nFUEL', background: '#c6ff3d', foreground: '#10160a' },
  { side: -1, z: -62, text: 'BEAN\nCO.', background: '#ff8a3d', foreground: '#1b0d04' },
  { side: 1, z: -124, text: 'HOT\nGAS', background: '#63f4ff', foreground: '#052a2e' },
  { side: -1, z: -178, text: 'BURRITO\nBARN', background: '#ff5c8a', foreground: '#2a0713' },
]

function Billboard({ data }: { data: BillboardData }) {
  const texture = useMemo(
    () => makeSignTexture(data.text, data.background, data.foreground),
    [data],
  )

  return (
    <>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 3.6, 5, 1]} />
        <meshStandardMaterial color="#211e2a" roughness={0.7} metalness={0.4} flatShading />
      </mesh>
      <mesh position={[0, 3.65, 0]}>
        <boxGeometry args={[3.5, 1.7, 0.18]} />
        <meshStandardMaterial color="#1b1826" roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {texture && (
        <mesh position={[0, 3.65, 0.1]}>
          <planeGeometry args={[3.25, 1.48]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, 2.82, 0.12]}>
        <boxGeometry args={[3.2, 0.05, 0.05]} />
        <meshStandardMaterial
          color={data.background}
          emissive={data.background}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}

export function Billboards() {
  const refs = useRef<Array<Group | null>>([])

  useFrame((_state, rawDelta) => {
    if (!runtime.running) return
    const step = runtime.speed * Math.min(rawDelta, 0.05)
    for (const group of refs.current) {
      if (!group) continue
      group.position.z += step
      if (group.position.z > 20) group.position.z -= WRAP
    }
  })

  return (
    <group>
      {BILLBOARDS.map((data, index) => (
        <group
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          position={[data.side * 6.9, 0, data.z]}
          rotation={[0, -data.side * Math.PI * 0.5, 0]}
        >
          <Billboard data={data} />
        </group>
      ))}
    </group>
  )
}
