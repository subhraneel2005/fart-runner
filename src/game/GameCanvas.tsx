import { Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { Suspense } from 'react'
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

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 3.8, 8.4], fov: 62, near: 0.1, far: 300 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#221a30')}
    >
      <fog attach="fog" args={['#59334d', 40, 172]} />

      <hemisphereLight color="#9a8fd6" groundColor="#2d2030" intensity={1.15} />
      <ambientLight intensity={0.3} color="#cbb8e2" />
      <directionalLight position={[-8, 13, -10]} intensity={2.4} color="#ffc48a" />
      <directionalLight position={[8, 7, 10]} intensity={0.75} color="#8ea6ff" />
      <pointLight position={[0, 2.3, 4]} intensity={16} distance={18} color="#ffb07a" />
      <pointLight position={[-5.6, 3.4, -10]} intensity={20} distance={30} color="#c6ff3d" />
      <pointLight position={[5.6, 3.2, -24]} intensity={18} distance={32} color="#ff7a9a" />

      <Suspense fallback={null}>
        <Stars radius={150} depth={60} count={900} factor={4} saturation={0} fade speed={0.3} />

        <CameraRig />
        <GameLoop />
        <Track />
        <Physics gravity={[0, -CONFIG.gravity, 0]} paused={paused} timeStep="vary">
          <World key={runId} />
        </Physics>
        <FartParticles />
      </Suspense>
    </Canvas>
  )
}
