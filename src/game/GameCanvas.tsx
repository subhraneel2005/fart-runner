import { Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { Suspense, useMemo } from 'react'
import { CONFIG } from '../config'
import { useGameStore } from '../store/gameStore'
import { Bean } from './Bean'
import { CameraRig } from './CameraRig'
import { FartParticles } from './Particles'
import { GameLoop } from './GameLoop'
import { NuclearBlast } from './NuclearBlast'
import { Obstacle } from './Obstacle'
import { Player } from './Player'
import { PowerUp } from './PowerUp'
import { Spawner } from './Spawner'
import { resolveTimeOfDay } from './timeOfDay'
import { Track } from './Track'

function World() {
  const obstacles = useGameStore((state) => state.obstacles)
  const beans = useGameStore((state) => state.beans)
  const powerups = useGameStore((state) => state.powerups)
  const nukeId = useGameStore((state) => state.nukeId)

  return (
    <>
      <Player />
      <Spawner />
      <RigidBody type="fixed" name="ground" colliders={false} position={[0, -0.5, -45]}>
        <CuboidCollider args={[5, 0.5, 120]} />
      </RigidBody>
      {obstacles.map((item) => (
        <Obstacle key={item.id} entity={item} />
      ))}
      {beans.map((item) => (
        <Bean key={item.id} entity={item} />
      ))}
      {powerups.map((item) => (
        <PowerUp key={item.id} entity={item} />
      ))}
      {nukeId > 0 && <NuclearBlast key={nukeId} />}
    </>
  )
}

export function GameCanvas() {
  const phase = useGameStore((state) => state.phase)
  const runId = useGameStore((state) => state.runId)
  const paused = phase !== 'playing'
  const mode = useMemo(resolveTimeOfDay, [])
  const isDay = mode === 'day'

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 3.8, 8.4], fov: 62, near: 0.1, far: 300 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(isDay ? '#8bc5e8' : '#221a30')}
    >
      <fog attach="fog" args={[isDay ? '#b9d9ea' : '#59334d', isDay ? 55 : 40, isDay ? 230 : 172]} />

      {isDay ? (
        <>
          <hemisphereLight color="#d9ecff" groundColor="#8b7562" intensity={1.5} />
          <ambientLight intensity={0.35} color="#fff4df" />
          <directionalLight position={[-10, 18, -12]} intensity={3} color="#fff1c9" />
          <directionalLight position={[9, 8, 12]} intensity={0.8} color="#bcdcff" />
          <pointLight position={[0, 2.3, 4]} intensity={10} distance={18} color="#ffd6a0" />
          <pointLight position={[-5.6, 3.4, -10]} intensity={8} distance={30} color="#c6ff3d" />
        </>
      ) : (
        <>
          <hemisphereLight color="#9a8fd6" groundColor="#2d2030" intensity={1.15} />
          <ambientLight intensity={0.3} color="#cbb8e2" />
          <directionalLight position={[-8, 13, -10]} intensity={2.4} color="#ffc48a" />
          <directionalLight position={[8, 7, 10]} intensity={0.75} color="#8ea6ff" />
          <pointLight position={[0, 2.3, 4]} intensity={16} distance={18} color="#ffb07a" />
          <pointLight position={[-5.6, 3.4, -10]} intensity={20} distance={30} color="#c6ff3d" />
          <pointLight position={[5.6, 3.2, -24]} intensity={18} distance={32} color="#ff7a9a" />
        </>
      )}

      <Suspense fallback={null}>
        {!isDay && (
          <Stars radius={150} depth={60} count={900} factor={4} saturation={0} fade speed={0.3} />
        )}

        <CameraRig />
        <GameLoop />
        <Track mode={mode} />
        <Physics gravity={[0, -CONFIG.gravity, 0]} paused={paused} timeStep="vary">
          <World key={runId} />
        </Physics>
        <FartParticles />
      </Suspense>
    </Canvas>
  )
}
