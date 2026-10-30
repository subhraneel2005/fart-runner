import { CONFIG } from '../config'
import { scoreOf, useGameStore } from '../store/gameStore'

function formatNumber(value: number) {
  return Math.floor(value).toLocaleString('en-US')
}

function BeanIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="bean-icon">
      <ellipse cx="12" cy="14" rx="7" ry="9" transform="rotate(-24 12 14)" fill="#c6ff3d" />
      <path d="M14 5c1-3 4-3 5-2-2 1-2 3-5 2Z" fill="#63f4ff" />
    </svg>
  )
}

export function Hud() {
  const phase = useGameStore((state) => state.phase)
  const distance = useGameStore((state) => state.distance)
  const beans = useGameStore((state) => state.beansCollected)
  const bonus = useGameStore((state) => state.bonus)
  const gas = useGameStore((state) => state.gas)
  const charge = useGameStore((state) => state.charge)
  const boosting = useGameStore((state) => state.boosting)
  const rocketLeft = useGameStore((state) => state.rocketLeft)
  const antigravLeft = useGameStore((state) => state.antigravLeft)
  const profile = useGameStore((state) => state.profile)
  const muted = useGameStore((state) => state.muted)
  const toast = useGameStore((state) => state.toast)
  const toastId = useGameStore((state) => state.toastId)
  const flashId = useGameStore((state) => state.flashId)
  const togglePause = useGameStore((state) => state.togglePause)
  const toggleMuted = useGameStore((state) => state.toggleMuted)

  const score = scoreOf(distance, beans, bonus)
  const gasPercent = Math.max(0, Math.min(100, (gas / CONFIG.gasMax) * 100))

  return (
    <div className="hud">
      {flashId > 0 && <div key={`flash-${flashId}`} className="screen-flash" aria-hidden="true" />}

      <div className="hud-top">
        <div className="hud-stats">
          <div className="stat">
            <span className="stat-label">Distance</span>
            <span className="stat-value">
              {formatNumber(distance)}
              <em>m</em>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Score</span>
            <span className="stat-value">{formatNumber(score)}</span>
          </div>
          <div className="stat stat-beans">
            <span className="stat-label">Beans</span>
            <span className="stat-value">
              <BeanIcon />
              {beans}
            </span>
          </div>
        </div>

        <div className="hud-actions">
          {profile && (
            <div className="profile-chip" aria-label={`Playing as @${profile.username}`}>
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : null}
              <span>@{profile.username}</span>
            </div>
          )}
          <button className="hud-btn" type="button" onClick={togglePause}>
            {phase === 'paused' ? 'RESUME' : 'PAUSE'}
          </button>
          <button
            className="hud-btn hud-btn-icon"
            type="button"
            onClick={toggleMuted}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-pressed={muted}
          >
            {muted ? 'MUTED' : 'SOUND'}
          </button>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="gas-panel">
          <div className="meter-head">
            <span>Gas</span>
            <span>{Math.round(gasPercent)}%</span>
          </div>
          <div className="meter gas">
            <div
              className={`meter-fill gas-fill${gasPercent < 25 ? ' low' : ''}`}
              style={{ width: `${gasPercent}%` }}
            />
          </div>
          <div className={`charge-wrap${charge > 0 ? ' active' : ''}`}>
            <div className="charge-track">
              <div className="charge-fill" style={{ width: `${charge * 100}%` }} />
            </div>
            <span className="charge-label">Charge</span>
          </div>
          <p className="meter-caption">Hold jump to charge · release to rip</p>
        </div>

        <div className="powerups">
          {rocketLeft > 0 && (
            <div className="power-pill rocket">
              <span>Fart rocket</span>
              <b>{rocketLeft.toFixed(1)}s</b>
            </div>
          )}
          {antigravLeft > 0 && (
            <div className="power-pill antigrav">
              <span>Anti-gravity</span>
              <b>{antigravLeft.toFixed(1)}s</b>
            </div>
          )}
          {boosting && (
            <div className="power-pill boost">
              <span>Boost</span>
              <b>×{CONFIG.boostMul}</b>
            </div>
          )}
        </div>
      </div>

      {phase === 'playing' && distance < 45 && (
        <div className="controls-hint">
          <span>
            <b>A</b>
            <b>D</b> lanes
          </span>
          <span>
            <b>SPACE</b> hold + release
          </span>
          <span>
            <b>SHIFT</b> boost
          </span>
        </div>
      )}

      {toast && (
        <div key={`toast-${toastId}`} className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
