import { useGameStore } from '../store/gameStore'

export function PauseOverlay() {
  const resume = useGameStore((state) => state.resume)
  const restart = useGameStore((state) => state.restart)
  const goHome = useGameStore((state) => state.goHome)

  return (
    <div className="overlay pause-overlay">
      <div className="pause-card">
        <p className="overlay-eyebrow">Holding it in</p>
        <h2 className="pause-title">Paused</h2>
        <p className="pause-copy">The beans can wait. Your gas cannot.</p>

        <div className="controls-list">
          <div>
            <kbd>A</kbd>
            <kbd>D</kbd>
            <span>or ← → switch lanes</span>
          </div>
          <div>
            <kbd>SPACE</kbd>
            <span>hold to charge, release to jump</span>
          </div>
          <div>
            <kbd>SPACE</kbd>
            <span>in the air for a fart dash</span>
          </div>
          <div>
            <kbd>SHIFT</kbd>
            <span>or F to boost</span>
          </div>
          <div>
            <kbd>P</kbd>
            <span>or ESC to pause</span>
          </div>
        </div>

        <div className="overlay-actions">
          <button className="btn primary" type="button" onClick={resume}>
            RESUME
          </button>
          <button className="btn ghost" type="button" onClick={restart}>
            RESTART
          </button>
          <button className="btn ghost" type="button" onClick={goHome}>
            HOME
          </button>
        </div>
      </div>
    </div>
  )
}
