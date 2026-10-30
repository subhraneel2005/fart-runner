import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { runtime } from '../runtime'
import { makeSignTexture } from '../textures'

const WRAP = 240

interface GantryData {
  z: number
  text: string
  background: string
  foreground: string
}

const GANTRIES: GantryData[] = [
  { z: -38, text: 'FART\nFUEL', background: '#c6ff3d', foreground: '#10160a' },
  { z: -118, text: 'BEAN\nCO.', background: '#ff8a3d', foreground: '#1b0d04' },
  { z: -198, text: 'LET IT\nRIP', background: '#63f4ff', foreground: '#052a2e' },
]

function Gantry({ data }: { data: GantryData }) {
  const texture = useMemo(
    () => makeSignTexture(data.text, data.background, data.foreground),
    [data],
  )
  return (
    <>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 4.68, 3.5, 0]}>
          <cylinderGeometry args={[0.085, 0.14, 7, 5, 1]} />
          <meshStandardMaterial color="#211e2a" roughness={0.7} metalness={0.4} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 7, 0]}>
        <boxGeometry args={[9.7, 0.26, 0.3]} />
        <meshStandardMaterial color="#211e2a" roughness={0.7} metalness={0.35} flatShading />
      </mesh>
      <mesh position={[0, 6.25, 0]}>
        <boxGeometry args={[4.45, 1.55, 0.18]} />
        <meshStandardMaterial color="#1b1826" roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {texture && (
        <mesh position={[0, 6.25, 0.1]}>
          <planeGeometry args={[4.15, 1.3]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, 5.4, 0.14]}>
        <boxGeometry args={[4.5, 0.06, 0.08]} />
        <meshStandardMaterial
          color={data.background}
          emissive={data.background}
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}

export function OverheadSigns() {
  const refs = useRef<Array<Group | null>>([])

  useFrame((_state, rawDelta) => {
    if (!runtime.running) return
    const step = runtime.speed * Math.min(rawDelta, 0.05)
    for (const group of refs.current) {
      if (!group) continue
      group.position.z += step
      if (group.position.z > 28) group.position.z -= WRAP
    }
  })

  return (
    <group>
      {GANTRIES.map((data, index) => (
        <group
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          position={[0, 0, data.z]}
        >
          <Gantry data={data} />
        </group>
      ))}
    </group>
  )
}
