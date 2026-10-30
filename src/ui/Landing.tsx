import { useMemo, useState, type FormEvent } from 'react'
import { initAudio } from '../lib/audio'
import { fetchXProfile } from '../lib/api'
import { cacheProfileAvatar } from '../lib/avatarCache'
import { defaultProfile } from '../lib/avatars'
import { clearSavedProfile, loadSavedProfile, saveProfile } from '../lib/storage'
import { useGameStore } from '../store/gameStore'

export function Landing() {
  const saved = useMemo(() => loadSavedProfile(), [])
  const [username, setUsername] = useState(saved?.username ?? '')
  const [loading, setLoading] = useState(false)
  const startRun = useGameStore((state) => state.startRun)
  const showToast = useGameStore((state) => state.showToast)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (loading) return
    initAudio()

    const clean = username.replace(/^@/, '').replace(/\s+/g, '').trim()

    if (!clean) {
      clearSavedProfile()
      startRun(defaultProfile(''))
      return
    }

    if (saved && saved.username.toLowerCase() === clean.toLowerCase()) {
      if (saved.avatarUrl?.startsWith('data:')) {
        startRun(saved)
        return
      }
      setLoading(true)
      const cached = await cacheProfileAvatar(saved)
      if (cached !== saved) saveProfile(cached)
      startRun(cached)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const profile = await fetchXProfile(clean)
      saveProfile(profile)
      startRun(profile)
    } catch (error) {
      const profile = defaultProfile(clean)
      saveProfile(profile)
      startRun(profile)
      showToast(error instanceof Error ? error.message : 'Profile lookup failed. Running as default.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <span className="cloud cloud-a" />
        <span className="cloud cloud-b" />
        <span className="cloud cloud-c" />
        <span className="grid-glow" />
      </div>

      <header className="landing-top">
        <div className="brand">
          <span className="brand-mark">FR</span>
          <span className="brand-name">Fart Runner</span>
        </div>
        <div className="landing-meta">Gas-powered · 3D endless runner · v1.0</div>
      </header>

      <main className="landing-main">
        <p className="eyebrow">Your gas. Your glory.</p>
        <h1 className="title">
          FART
          <span>RUNNER</span>
        </h1>
        <p className="subtitle">
          Strap your face to a bean-powered rocket and see how far the wind takes you. Dodge the
          roadblocks. Hoover up the beans. Let it rip.
        </p>

        <form className="start-form" onSubmit={handleSubmit}>
          <div className="field-wrap">
            <label className="sr-only" htmlFor="x-handle">
              Your X username
            </label>
            <div className="handle-field">
              <span className="at" aria-hidden="true">
                @
              </span>
              <input
                id="x-handle"
                name="handle"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="yourusername"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={15}
                inputMode="text"
                disabled={loading}
              />
            </div>
            <button className={`rip-button${loading ? ' is-loading' : ''}`} type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>SNIFFING OUT @{username.replace(/^@/, '').toUpperCase()}</span>
                </>
              ) : (
                <>
                  <span>LET IT RIP</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="fineprint">
          No login. No database. Leave the handle blank to run as a mystery farter. X details are
          fetched server-side and cached for 10 minutes. Your profile photo is saved on this device,
          so replays and reloads never fetch it again. If the X API is unavailable, a public
          read-only mirror is used.
        </p>
      </main>

      <footer className="landing-foot">
        <span>Beans · Boost · Blast off</span>
        <a
          className="foot-credit"
          href="https://sketchfab.com/3d-models/low-poly-stickman-23d1bb8b97934f22b18b3e5530b2e6c3"
          target="_blank"
          rel="noreferrer"
        >
          3D model by sifrani · CC BY 4.0
        </a>
        <span className="foot-controls">Desktop + mobile</span>
      </footer>
    </div>
  )
}
