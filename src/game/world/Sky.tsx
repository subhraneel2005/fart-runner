import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BackSide, type Group } from 'three'
import { makeGlowTexture } from '../textures'

const VERTEX = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

const FRAGMENT = `
varying vec3 vWorldPosition;
void main() {
  vec3 dir = normalize(vWorldPosition);
  float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 low = vec3(0.72, 0.30, 0.18);
  vec3 mid = vec3(0.16, 0.09, 0.21);
  vec3 high = vec3(0.024, 0.03, 0.085);
  vec3 color = mix(low, mid, smoothstep(0.48, 0.63, h));
  color = mix(color, high, smoothstep(0.63, 0.92, h));
  float sunGlow = pow(max(dot(dir, normalize(vec3(0.18, 0.04, -1.0))), 0.0), 5.0);
  color += vec3(0.42, 0.16, 0.04) * sunGlow;
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

interface Mountain {
  x: number
  z: number
  height: number
  radius: number
  rotation: number
  color: string
  snow: boolean
}

interface Cloud {
  x: number
  y: number
  z: number
  puffs: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number }>
  color: string
}

export function Sky() {
  const glow = useMemo(() => makeGlowTexture('orange'), [])
  const moon = useRef<Group>(null)

  const mountains = useMemo<Mountain[]>(() => {
    const palette = ['#2d2441', '#352a49', '#292337', '#3d2c4b']
    return Array.from({ length: 14 }, (_, index) => {
      const side = index % 2 === 0 ? 1 : -1
      const near = index % 3 === 0
      return {
        x: side * (18 + Math.random() * 48),
        z: near ? -60 - Math.random() * 50 : -110 - Math.random() * 80,
        height: near ? 12 + Math.random() * 16 : 22 + Math.random() * 28,
        radius: 9 + Math.random() * 15,
        rotation: Math.random() * Math.PI,
        color: palette[index % palette.length],
        snow: near ? Math.random() < 0.35 : Math.random() < 0.75,
      }
    })
  }, [])

  const clouds = useMemo<Cloud[]>(() => {
    const palette = ['#a681ae', '#957099', '#b58cba', '#886593']
    return Array.from({ length: 5 }, (_, index) => {
      const side = index % 2 === 0 ? 1 : -1
      const puffs = Array.from({ length: 6 }, (_, puffIndex) => ({
        x: (puffIndex - 2.5) * 2.6 + (Math.random() - 0.5) * 1.6,
        y: (Math.random() - 0.5) * 1.4,
        z: (Math.random() - 0.5) * 2.4,
        sx: 2.8 + Math.random() * 2.4,
        sy: 1.3 + Math.random() * 0.8,
        sz: 1.8 + Math.random() * 1.6,
      }))
      return {
        x: side * (22 + Math.random() * 34),
        y: 22 + Math.random() * 11,
        z: -62 - Math.random() * 90,
        puffs,
        color: palette[index % palette.length],
      }
    })
  }, [])

  useFrame((_state, rawDelta) => {
    if (moon.current) moon.current.rotation.y += Math.min(rawDelta, 0.05) * 0.025
  })

  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[230, 32, 18]} />
        <shaderMaterial
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          side={BackSide}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <group ref={moon} position={[30, 25, -96]}>
        <mesh>
          <icosahedronGeometry args={[6.4, 1]} />
          <meshStandardMaterial
            color="#ffe6ba"
            emissive="#ffb46e"
            emissiveIntensity={0.38}
            roughness={0.9}
            metalness={0}
            flatShading
            fog={false}
          />
        </mesh>
        {[
          [2.2, 1.3, 5.2, 1.0],
          [-2.6, -0.7, 5.45, 0.8],
          [0.2, 3.0, 5.0, 0.7],
          [-0.6, -2.8, 5.15, 0.6],
        ].map(([x, y, z, scale], index) => (
          <mesh key={index} position={[x, y, z]} scale={[scale, scale, 0.35]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#e5bf92" flatShading fog={false} roughness={1} />
          </mesh>
        ))}
        {glow && (
          <sprite scale={[34, 34, 34]}>
            <spriteMaterial
              map={glow}
              transparent
              opacity={0.28}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        )}
      </group>

      {clouds.map((cloud, index) => (
        <group key={index} position={[cloud.x, cloud.y, cloud.z]}>
          {cloud.puffs.map((puff, puffIndex) => (
            <mesh
              key={puffIndex}
              position={[puff.x, puff.y, puff.z]}
              scale={[puff.sx, puff.sy, puff.sz]}
            >
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={cloud.color}
                emissive={cloud.color}
                emissiveIntensity={0.26}
                flatShading
                roughness={1}
              />
            </mesh>
          ))}
        </group>
      ))}

      {mountains.map((mountain, index) => (
        <group key={index} position={[mountain.x, 0, mountain.z]} rotation={[0, mountain.rotation, 0]}>
          <mesh position={[0, mountain.height / 2, 0]}>
            <coneGeometry args={[mountain.radius, mountain.height, 5, 1]} />
            <meshStandardMaterial color={mountain.color} flatShading roughness={1} />
          </mesh>
          {mountain.snow && (
            <mesh position={[0, mountain.height * 0.83, 0]}>
              <coneGeometry args={[mountain.radius * 0.34, mountain.height * 0.26, 5, 1]} />
              <meshStandardMaterial color="#bdaac9" flatShading roughness={1} />
            </mesh>
          )}
        </group>
      ))}
    </>
  )
}
