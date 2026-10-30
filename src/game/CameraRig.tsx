import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'
import { fx, isRocketActive, runtime } from './runtime'

const LOOK = new Vector3()

export function CameraRig() {
  const camera = useThree((state) => state.camera)
  const current = useRef({ x: 0, y: 3.8, z: 8.4 })

  useFrame((_state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const targetX = runtime.playerX * 0.42
    const rocket = isRocketActive()
    const targetY = 3.8 + (rocket ? 0.22 : 0)
    const targetZ = 8.4 + (rocket ? 0.65 : 0)
    const smoothing = Math.min(1, dt * 5.5)

    current.current.x += (targetX - current.current.x) * smoothing
    current.current.y += (targetY - current.current.y) * smoothing
    current.current.z += (targetZ - current.current.z) * smoothing

    const shake = fx.shake
    const jitterX = (Math.random() - 0.5) * shake * 0.32
    const jitterY = (Math.random() - 0.5) * shake * 0.28

    camera.position.set(
      current.current.x + jitterX,
      current.current.y + jitterY,
      current.current.z,
    )
    LOOK.set(runtime.playerX * 0.16 + jitterX * 0.4, 1.4 + jitterY * 0.3, -9)
    camera.lookAt(LOOK)

    const perspective = camera as PerspectiveCamera
    const targetFov = 62 + (rocket ? 4.5 : 0) + (runtime.boosting ? 2 : 0)
    if (Math.abs(perspective.fov - targetFov) > 0.01) {
      perspective.fov += (targetFov - perspective.fov) * Math.min(1, dt * 3.2)
      perspective.updateProjectionMatrix()
    }
  })

  return null
}
