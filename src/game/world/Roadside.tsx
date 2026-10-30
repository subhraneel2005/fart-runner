import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, Object3D, type InstancedMesh } from 'three'
import { runtime } from '../runtime'

interface ScrollItem {
  x: number
  z: number
  rotation: number
}

interface TreeItem extends ScrollItem {
  scale: number
  color: string
}

interface PropItem extends ScrollItem {
  color: string
}

const TREE_COLORS = ['#2f6b45', '#3f7d4f', '#2b5a44', '#4b8757', '#38705a']
const BUSH_COLORS = ['#3c5f3e', '#4b6a45', '#5a4f6e', '#35584c', '#5f5540']
const BARREL_COLORS = ['#c65a3e', '#4e7a86', '#c7973a', '#7b4c72', '#4e6d4a']

function createLamps(): ScrollItem[] {
  return Array.from({ length: 12 }, (_, index) => {
    const side = index % 2 === 0 ? 1 : -1
    const pair = Math.floor(index / 2)
    return {
      x: side * 5.15,
      z: 10 - pair * 34 - (side < 0 ? 17 : 0),
      rotation: 0,
    }
  })
}

function createTrees(): TreeItem[] {
  return Array.from({ length: 12 }, (_, index) => {
    const side = index % 2 === 0 ? 1 : -1
    const pair = Math.floor(index / 2)
    return {
      x: side * (5.95 + Math.random() * 0.35),
      z: 6 - pair * 30 - (side < 0 ? 15 : 0),
      rotation: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.4,
      color: TREE_COLORS[index % TREE_COLORS.length],
    }
  })
}

function createBushes(): TreeItem[] {
  return Array.from({ length: 16 }, (_, index) => {
    const side = index % 2 === 0 ? 1 : -1
    const pair = Math.floor(index / 2)
    return {
      x: side * (5.6 + Math.random() * 0.4),
      z: 4 - pair * 26 - (side < 0 ? 13 : 0),
      rotation: Math.random() * Math.PI * 2,
      scale: 0.75 + Math.random() * 0.5,
      color: BUSH_COLORS[index % BUSH_COLORS.length],
    }
  })
}

function createBarrels(): PropItem[] {
  return Array.from({ length: 10 }, (_, index) => {
    const side = index % 2 === 0 ? 1 : -1
    const pair = Math.floor(index / 2)
    return {
      x: side * 5.32,
      z: -pair * 42 - (side < 0 ? 21 : 0),
      rotation: 0,
      color: BARREL_COLORS[index % BARREL_COLORS.length],
    }
  })
}

function createCones(): ScrollItem[] {
  return Array.from({ length: 10 }, (_, index) => {
    const side = index % 2 === 0 ? 1 : -1
    const pair = Math.floor(index / 2)
    return {
      x: side * 5.02,
      z: -6 - pair * 42 - (side < 0 ? 21 : 0),
      rotation: 0,
    }
  })
}

export function Roadside() {
  const lamps = useMemo(createLamps, [])
  const trees = useMemo(createTrees, [])
  const bushes = useMemo(createBushes, [])
  const barrels = useMemo(createBarrels, [])
  const cones = useMemo(createCones, [])

  const lampPole = useRef<InstancedMesh>(null)
  const lampHead = useRef<InstancedMesh>(null)
  const trunk = useRef<InstancedMesh>(null)
  const foliage = useRef<InstancedMesh>(null)
  const bushMesh = useRef<InstancedMesh>(null)
  const barrelMesh = useRef<InstancedMesh>(null)
  const coneMesh = useRef<InstancedMesh>(null)
  const coneBand = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useEffect(() => {
    const treeMesh = foliage.current
    if (treeMesh) {
      trees.forEach((tree, index) => treeMesh.setColorAt(index, new Color(tree.color)))
      if (treeMesh.instanceColor) treeMesh.instanceColor.needsUpdate = true
    }
    const bush = bushMesh.current
    if (bush) {
      bushes.forEach((item, index) => bush.setColorAt(index, new Color(item.color)))
      if (bush.instanceColor) bush.instanceColor.needsUpdate = true
    }
    const barrel = barrelMesh.current
    if (barrel) {
      barrels.forEach((item, index) => barrel.setColorAt(index, new Color(item.color)))
      if (barrel.instanceColor) barrel.instanceColor.needsUpdate = true
    }
  }, [trees, bushes, barrels])

  useFrame((_state, rawDelta) => {
    const step = runtime.running ? runtime.speed * Math.min(rawDelta, 0.05) : 0

    if (step > 0) {
      for (const lamp of lamps) {
        lamp.z += step
        if (lamp.z > 16) lamp.z -= 204
      }
      for (const tree of trees) {
        tree.z += step
        if (tree.z > 18) tree.z -= 180
      }
      for (const bush of bushes) {
        bush.z += step
        if (bush.z > 17) bush.z -= 208
      }
      for (const barrel of barrels) {
        barrel.z += step
        if (barrel.z > 18) barrel.z -= 210
      }
      for (const cone of cones) {
        cone.z += step
        if (cone.z > 18) cone.z -= 210
      }
    }

    if (lampPole.current) {
      lamps.forEach((lamp, index) => {
        dummy.position.set(lamp.x, 1.37, lamp.z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        lampPole.current?.setMatrixAt(index, dummy.matrix)
      })
      lampPole.current.instanceMatrix.needsUpdate = true
    }

    if (lampHead.current) {
      lamps.forEach((lamp, index) => {
        dummy.position.set(lamp.x, 2.58, lamp.z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        lampHead.current?.setMatrixAt(index, dummy.matrix)
      })
      lampHead.current.instanceMatrix.needsUpdate = true
    }

    if (trunk.current) {
      trees.forEach((tree, index) => {
        dummy.position.set(tree.x, 0.12 + 0.7 * tree.scale, tree.z)
        dummy.rotation.set(0, tree.rotation, 0)
        dummy.scale.set(tree.scale, tree.scale, tree.scale)
        dummy.updateMatrix()
        trunk.current?.setMatrixAt(index, dummy.matrix)
      })
      trunk.current.instanceMatrix.needsUpdate = true
    }

    if (foliage.current) {
      trees.forEach((tree, index) => {
        dummy.position.set(tree.x, 0.12 + 1.75 * tree.scale, tree.z)
        dummy.rotation.set(0, tree.rotation, 0)
        dummy.scale.set(tree.scale * 1.15, tree.scale * 1.3, tree.scale * 1.15)
        dummy.updateMatrix()
        foliage.current?.setMatrixAt(index, dummy.matrix)
      })
      foliage.current.instanceMatrix.needsUpdate = true
    }

    if (bushMesh.current) {
      bushes.forEach((bush, index) => {
        dummy.position.set(bush.x, 0.3, bush.z)
        dummy.rotation.set(0, bush.rotation, 0)
        dummy.scale.set(bush.scale, bush.scale * 0.8, bush.scale)
        dummy.updateMatrix()
        bushMesh.current?.setMatrixAt(index, dummy.matrix)
      })
      bushMesh.current.instanceMatrix.needsUpdate = true
    }

    if (barrelMesh.current) {
      barrels.forEach((barrel, index) => {
        dummy.position.set(barrel.x, 0.52, barrel.z)
        dummy.rotation.set(0, barrel.rotation, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        barrelMesh.current?.setMatrixAt(index, dummy.matrix)
      })
      barrelMesh.current.instanceMatrix.needsUpdate = true
    }

    if (coneMesh.current) {
      cones.forEach((cone, index) => {
        dummy.position.set(cone.x, 0.42, cone.z)
        dummy.rotation.set(0, cone.rotation, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        coneMesh.current?.setMatrixAt(index, dummy.matrix)
      })
      coneMesh.current.instanceMatrix.needsUpdate = true
    }

    if (coneBand.current) {
      cones.forEach((cone, index) => {
        dummy.position.set(cone.x, 0.45, cone.z)
        dummy.rotation.set(0, cone.rotation, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        coneBand.current?.setMatrixAt(index, dummy.matrix)
      })
      coneBand.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={lampPole} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.055, 0.08, 2.5, 5, 1]} />
        <meshStandardMaterial color="#211e2a" roughness={0.7} metalness={0.35} flatShading />
      </instancedMesh>
      <instancedMesh ref={lampHead} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <boxGeometry args={[0.36, 0.14, 0.36]} />
        <meshStandardMaterial
          color="#ffd08a"
          emissive="#ffb45e"
          emissiveIntensity={2.4}
          toneMapped={false}
          roughness={0.4}
        />
      </instancedMesh>

      <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.1, 0.15, 1.4, 5, 1]} />
        <meshStandardMaterial color="#4a3628" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={foliage} args={[undefined, undefined, trees.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} flatShading />
      </instancedMesh>

      <instancedMesh ref={bushMesh} args={[undefined, undefined, bushes.length]} frustumCulled={false}>
        <icosahedronGeometry args={[0.46, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={1} flatShading />
      </instancedMesh>

      <instancedMesh ref={barrelMesh} args={[undefined, undefined, barrels.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.24, 0.24, 0.8, 6, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.65} metalness={0.25} flatShading />
      </instancedMesh>

      <instancedMesh ref={coneMesh} args={[undefined, undefined, cones.length]} frustumCulled={false}>
        <coneGeometry args={[0.18, 0.58, 6, 1]} />
        <meshStandardMaterial color="#ff7a3d" emissive="#ff5a1f" emissiveIntensity={0.18} roughness={0.8} flatShading />
      </instancedMesh>
      <instancedMesh ref={coneBand} args={[undefined, undefined, cones.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.14, 0.16, 0.06, 6, 1]} />
        <meshStandardMaterial color="#ffe9c0" emissive="#8a6c3a" emissiveIntensity={0.12} roughness={0.8} flatShading />
      </instancedMesh>
    </group>
  )
}
