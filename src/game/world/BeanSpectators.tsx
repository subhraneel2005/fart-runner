import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { runtime } from '../runtime'

const WRAP = 230

interface Spectator {
  side: number
  z: number
  color: string
  head: string
  phase: number
  hat: string | null
}

const SPECTATORS: Spectator[] = [
  { side: 1, z: -26, color: '#c6ff3d', head: '#d9ff7a', phase: 0, hat: '#ff5c8a' },
  { side: -1, z: -58, color: '#ff8a3d', head: '#ffb27a', phase: 1.3, hat: null },
  { side: 1, z: -94, color: '#63f4ff', head: '#a8f8ff', phase: 2.6, hat: '#ffd23d' },
  { side: -1, z: -132, color: '#ff5c8a', head: '#ff9ab5', phase: 3.9, hat: null },
  { side: 1, z: -170, color: '#c6ff3d', head: '#d9ff7a', phase: 5.1, hat: '#63f4ff' },
  { side: -1, z: -204, color: '#ff8a3d', head: '#ffb27a', phase: 0.7, hat: null },
]

function BeanSpectator({ data }: { data: Spectator }) {
  return (
    <>
      <mesh position={[0, 0.56, 0]}>
        <capsuleGeometry args={[0.22, 0.36, 6, 10]} />
        <meshStandardMaterial color={data.color} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.23, 10, 8]} />
        <meshStandardMaterial color={data.head} roughness={0.65} flatShading />
      </mesh>

      <mesh position={[-0.09, 1.09, 0.19]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshBasicMaterial color="#f7fff0" toneMapped={false} />
      </mesh>
      <mesh position={[0.09, 1.09, 0.19]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshBasicMaterial color="#f7fff0" toneMapped={false} />
      </mesh>
      <mesh position={[-0.09, 1.09, 0.225]}>
        <sphereGeometry args={[0.022, 6, 5]} />
        <meshBasicMaterial color="#15151c" toneMapped={false} />
      </mesh>
      <mesh position={[0.09, 1.09, 0.225]}>
        <sphereGeometry args={[0.022, 6, 5]} />
        <meshBasicMaterial color="#15151c" toneMapped={false} />
      </mesh>

      <mesh position={[-0.3, 0.7, 0]} rotation={[0, 0, 0.45]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 7]} />
        <meshStandardMaterial color={data.color} roughness={0.75} flatShading />
      </mesh>
      <mesh position={[0.3, 0.7, 0]} rotation={[0, 0, -0.45]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 7]} />
        <meshStandardMaterial color={data.color} roughness={0.75} flatShading />
      </mesh>

      {data.hat && (
        <mesh position={[0, 1.32, 0]}>
          <coneGeometry args={[0.16, 0.28, 6, 1]} />
          <meshStandardMaterial color={data.hat} roughness={0.7} flatShading />
        </mesh>
      )}
    </>
  )
}

export function BeanSpectators() {
  const refs = useRef<Array<Group | null>>([])

  useFrame((_state, rawDelta) => {
    const step = runtime.running ? runtime.speed * Math.min(rawDelta, 0.05) : 0
    refs.current.forEach((group, index) => {
      if (!group) return
      const data = SPECTATORS[index]
      if (step > 0) {
        group.position.z += step
        if (group.position.z > 20) group.position.z -= WRAP
      }
      group.position.y = Math.sin(runtime.time * 3.2 + data.phase) * 0.05
    })
  })

  return (
    <group>
      {SPECTATORS.map((data, index) => (
        <group
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          position={[data.side * 5.55, 0, data.z]}
          rotation={[0, -data.side * Math.PI * 0.5, 0]}
        >
          <BeanSpectator data={data} />
        </group>
      ))}
    </group>
  )
}
