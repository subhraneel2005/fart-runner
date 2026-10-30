import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  Box3,
  BufferAttribute,
  type BufferGeometry,
  type Mesh,
  MeshStandardMaterial,
  type Material,
  Vector3,
} from 'three'
import { CONFIG } from '../config'
import { runtime } from './runtime'

const MODEL_URL = '/3d_model/low_poly_stickman.glb'
const TARGET_HEIGHT = 2
const HEAD_RATIO = 0.885
const HEAD_RADIUS_RATIO = 0.195

const RUN_VERTEX = `
  if (abs(aRun.y) > 0.0001) {
    float legPhase = aRun.y > 0.0 ? 0.0 : 3.14159265;
    float legAngle = sin(uRunPhase + legPhase) * 0.62 * uRunAmount * abs(aRun.y);
    float lc = cos(legAngle);
    float ls = sin(legAngle);
    float ly = transformed.y;
    float lz = transformed.z - 2.35;
    transformed.y = ly * lc - lz * ls;
    transformed.z = 2.35 + ly * ls + lz * lc;
  }
  if (abs(aRun.x) > 0.0001) {
    float armPhase = aRun.x > 0.0 ? 3.14159265 : 0.0;
    float armAngle = sin(uRunPhase + armPhase) * -0.42 * uRunAmount * abs(aRun.x);
    float ac = cos(armAngle);
    float as = sin(armAngle);
    float ay = transformed.y;
    float az = transformed.z - 3.95;
    transformed.y = ay * ac - az * as;
    transformed.z = 3.95 + ay * as + az * ac;
  }
`

interface RunUniforms {
  uRunPhase: { value: number }
  uRunAmount: { value: number }
}

useGLTF.preload(MODEL_URL)

function poseArms(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position') as BufferAttribute
  if (!position) return
  const weights = new Float32Array(position.count * 3)

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const ax = Math.abs(x)
    let armWeight = 0
    let legWeight = 0

    if (ax > 0.95 && z > 3.1 && z < 4.4) {
      const t = Math.min(1, (ax - 0.95) / 1.1)
      const angle = t * 1.28
      const dx = ax - 0.95
      const dz = z - 3.95
      const nx = 0.95 + dx * Math.cos(angle) + dz * Math.sin(angle)
      const nz = 3.95 - dx * Math.sin(angle) + dz * Math.cos(angle)
      position.setX(i, Math.sign(x) * nx)
      position.setZ(i, nz)
      armWeight = Math.sign(x) * t
    }

    if (z < 2.5 && ax < 0.8) {
      legWeight = Math.sign(x) * Math.min(1, Math.max(0, (2.5 - z) / 0.9))
    }

    weights[i * 3] = armWeight
    weights[i * 3 + 1] = legWeight
  }

  geometry.setAttribute('aRun', new BufferAttribute(weights, 3))
  position.needsUpdate = true
  geometry.computeVertexNormals()
}

function disposeMaterial(material: Material | Material[]) {
  if (Array.isArray(material)) material.forEach((item) => item.dispose())
  else material.dispose()
}

export function CharacterModel({ avatarTexture }: { avatarTexture: import('three').Texture }) {
  const { scene } = useGLTF(MODEL_URL)

  const character = useMemo(() => {
    const root = scene.clone(true)

    root.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.geometry = mesh.geometry.clone()
      poseArms(mesh.geometry)

      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const cloned = sourceMaterials.map((material) => {
        const next = material.clone()
        if ((next as MeshStandardMaterial).isMeshStandardMaterial) {
          const standard = next as MeshStandardMaterial
          standard.color.set('#6b7566')
          standard.roughness = 0.55
          standard.metalness = 0.16
          standard.flatShading = true
          standard.customProgramCacheKey = () => 'fart-runner-run-v1'
          const runUniforms: RunUniforms = {
            uRunPhase: { value: 0 },
            uRunAmount: { value: 0 },
          }
          standard.userData.runUniforms = runUniforms
          standard.onBeforeCompile = (shader) => {
            shader.uniforms.uRunPhase = runUniforms.uRunPhase
            shader.uniforms.uRunAmount = runUniforms.uRunAmount
            shader.vertexShader = `uniform float uRunPhase;\nuniform float uRunAmount;\nattribute vec3 aRun;\n${shader.vertexShader}`
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `#include <begin_vertex>\n${RUN_VERTEX}`,
            )
          }
          standard.needsUpdate = true
        }
        return next
      })
      mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0]
    })

    const box = new Box3().setFromObject(root)
    const size = new Vector3()
    const center = new Vector3()
    box.getSize(size)
    box.getCenter(center)
    const scale = TARGET_HEIGHT / size.y
    root.scale.setScalar(scale)
    root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)

    return { root, scale }
  }, [scene])

  useFrame(() => {
    const amount = runtime.grounded ? 1 : 0
    character.root.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) {
        const uniforms = material.userData.runUniforms as RunUniforms | undefined
        if (!uniforms) continue
        uniforms.uRunPhase.value = runtime.runCycle
        uniforms.uRunAmount.value = amount
      }
    })
  })

  useEffect(() => {
    return () => {
      character.root.traverse((child) => {
        const mesh = child as Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        disposeMaterial(mesh.material)
      })
    }
  }, [character])

  const headY = TARGET_HEIGHT * HEAD_RATIO
  const headRadius = TARGET_HEIGHT * HEAD_RADIUS_RATIO

  return (
    <group position={[0, -CONFIG.playerY, 0]}>
      <primitive object={character.root} />

      <mesh position={[0, headY, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[headRadius, 40, 32]} />
        <meshBasicMaterial map={avatarTexture} toneMapped={false} />
      </mesh>

      <mesh position={[0, TARGET_HEIGHT * 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
        <torusGeometry args={[TARGET_HEIGHT * 0.12, TARGET_HEIGHT * 0.011, 8, 28]} />
        <meshStandardMaterial
          color="#c6ff3d"
          emissive="#c6ff3d"
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
