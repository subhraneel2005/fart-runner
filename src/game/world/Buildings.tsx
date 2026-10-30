import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { runtime } from '../runtime'
import type { TimeOfDay } from '../timeOfDay'
import { makeSignTexture, makeWindowTexture } from '../textures'

const WRAP = 210
const NIGHT_PALETTE = ['#34384e', '#3d3048', '#2f3f3b', '#473a35', '#363243', '#40364a']
const DAY_PALETTE = ['#718092', '#816f86', '#688477', '#8c7768', '#71708b', '#80718a']
const SIGN_STYLES = [
  { text: 'FART\nFUEL', background: '#c6ff3d', foreground: '#10160a' },
  { text: 'BEAN\nCO.', background: '#ff8a3d', foreground: '#1b0d04' },
  { text: 'HOT\nGAS', background: '#63f4ff', foreground: '#052a2e' },
  { text: 'BURRITO\nBARN', background: '#ff5c8a', foreground: '#2a0713' },
  { text: '24H\nGAS', background: '#ffd23d', foreground: '#1b1404' },
]

interface BuildingData {
  side: number
  x: number
  z: number
  width: number
  height: number
  depth: number
  color: string
  window: 'warm' | 'cool'
  sign: number | null
  antenna: boolean
  roofBox: boolean
  neon: string | null
  awning: string | null
}

function createBuildings(mode: TimeOfDay): BuildingData[] {
  const palette = mode === 'day' ? DAY_PALETTE : NIGHT_PALETTE
  return Array.from({ length: 14 }, (_, index) => {
    const side = index % 2 === 0 ? 1 : -1
    const pair = Math.floor(index / 2)
    const width = 2.8 + Math.random() * 2.2
    const depth = 4.5 + Math.random() * 4
    const height = 6 + Math.random() * 10
    return {
      side,
      x: side * (7.5 + width / 2 + Math.random() * 2),
      z: 6 - pair * 30 - Math.random() * 6,
      width,
      height,
      depth,
      color: palette[index % palette.length],
      window: index % 4 === 0 ? 'cool' : 'warm',
      sign: pair % 2 === 0 ? index % SIGN_STYLES.length : null,
      antenna: height > 11 && Math.random() < 0.7,
      roofBox: Math.random() < 0.55,
      neon: index % 3 === 0 ? (index % 2 === 0 ? '#ff6b4a' : '#63f4ff') : null,
      awning:
        index % 3 === 0
          ? ['#ff8a3d', '#63f4ff', '#ff5c8a', '#ffd23d'][index % 4]
          : null,
    }
  })
}

function Building({
  data,
  texture,
  mode,
}: {
  data: BuildingData
  texture: ReturnType<typeof makeWindowTexture>
  mode: TimeOfDay
}) {
  const signStyle = data.sign === null ? null : SIGN_STYLES[data.sign]
  const signTexture = useMemo(
    () => (signStyle ? makeSignTexture(signStyle.text, signStyle.background, signStyle.foreground) : null),
    [signStyle],
  )
  const faceX = -data.side * (data.width / 2 + 0.02)
  const faceRotation = -data.side * Math.PI * 0.5

  return (
    <>
      <mesh position={[0, data.height / 2, 0]}>
        <boxGeometry args={[data.width, data.height, data.depth]} />
        <meshStandardMaterial color={data.color} roughness={0.86} metalness={0.05} flatShading />
      </mesh>

      <mesh position={[0, data.height + 0.18, 0]}>
        <boxGeometry args={[data.width + 0.4, 0.36, data.depth + 0.4]} />
        <meshStandardMaterial color="#1d1a27" roughness={0.9} flatShading />
      </mesh>

      {texture && (
        <mesh position={[faceX, data.height * 0.58, 0]} rotation={[0, faceRotation, 0]}>
          <planeGeometry args={[data.depth * 0.76, data.height * 0.46]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={mode === 'day' ? 0.4 : 0.92}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      <mesh position={[faceX - data.side * 0.015, 0.9, data.depth * 0.18]} rotation={[0, faceRotation, 0]}>
        <planeGeometry args={[1.05, 1.6]} />
        <meshStandardMaterial color="#211b28" roughness={0.8} metalness={0.1} />
      </mesh>

      {data.awning && (
        <mesh position={[faceX - data.side * 0.3, 2.35, data.depth * 0.1]}>
          <boxGeometry args={[0.62, 0.12, data.depth * 0.55]} />
          <meshStandardMaterial color={data.awning} roughness={0.8} flatShading />
        </mesh>
      )}

      {signTexture && (
        <mesh position={[faceX - data.side * 0.03, data.height * 0.85, 0]} rotation={[0, faceRotation, 0]}>
          <planeGeometry args={[Math.min(data.depth * 0.8, 3.3), 1.02]} />
          <meshBasicMaterial map={signTexture} toneMapped={false} />
        </mesh>
      )}

      {data.neon && (
        <mesh position={[faceX, data.height + 0.04, 0]}>
          <boxGeometry args={[0.06, 0.07, data.depth * 0.9]} />
          <meshStandardMaterial
            color={data.neon}
            emissive={data.neon}
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
      )}

      {data.roofBox && (
        <mesh position={[data.side * 0.35, data.height + 0.85, 0]}>
          <boxGeometry args={[data.width * 0.45, 1.1, data.depth * 0.4]} />
          <meshStandardMaterial color="#262230" roughness={0.9} flatShading />
        </mesh>
      )}

      {data.antenna && (
        <group position={[0, data.height + 0.2, 0]}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.035, 0.05, 2.4, 4, 1]} />
            <meshStandardMaterial color="#1d1a27" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh position={[0, 2.45, 0]}>
            <sphereGeometry args={[0.11, 6, 5]} />
            <meshStandardMaterial color="#ff5a5a" emissive="#ff3d3d" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
      )}
    </>
  )
}

export function Buildings({ mode }: { mode: TimeOfDay }) {
  const buildings = useMemo(() => createBuildings(mode), [mode])
  const textures = useMemo(
    () => ({ warm: makeWindowTexture('warm'), cool: makeWindowTexture('cool') }),
    [],
  )
  const refs = useRef<Array<Group | null>>([])

  useFrame((_state, rawDelta) => {
    if (!runtime.running) return
    const step = runtime.speed * Math.min(rawDelta, 0.05)
    for (const group of refs.current) {
      if (!group) continue
      group.position.z += step
      if (group.position.z > 24) group.position.z -= WRAP
    }
  })

  return (
    <group>
      {buildings.map((data, index) => (
        <group
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          position={[data.x, 0, data.z]}
        >
          <Building data={data} texture={textures[data.window]} mode={mode} />
        </group>
      ))}
    </group>
  )
}
