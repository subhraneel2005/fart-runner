import { useEffect, useMemo, useRef, useState } from 'react'
import {
  canShareImages,
  copyImageToClipboard,
  downloadBlob,
  renderShareCard,
  type ShareCardData,
} from '../lib/shareCard'
import { scoreOf, useGameStore } from '../store/gameStore'

type ShareStatus = { kind: 'ok' | 'warn' | 'error'; text: string }

export function GameOver() {
  const profile = useGameStore((state) => state.profile)
  const distance = useGameStore((state) => state.distance)
  const beans = useGameStore((state) => state.beansCollected)
  const bonus = useGameStore((state) => state.bonus)
  const best = useGameStore((state) => state.best)
  const headline = useGameStore((state) => state.headline)
  const restart = useGameStore((state) => state.restart)
  const goHome = useGameStore((state) => state.goHome)
  const restartRef = useRef<HTMLButtonElement>(null)
  const cardPromise = useRef<Promise<Blob> | null>(null)
  const [busy, setBusy] = useState<'share' | 'copy' | null>(null)
  const [status, setStatus] = useState<ShareStatus | null>(null)

  const score = scoreOf(distance, beans, bonus)
  const isBest = score > 0 && score >= best

  const data = useMemo<ShareCardData>(
    () => ({
      profile,
      headline,
      distance: Math.floor(distance),
      beans,
      score,
      best,
    }),
    [profile, headline, distance, beans, score, best],
  )

  useEffect(() => {
    restartRef.current?.focus()
  }, [])

  useEffect(() => {
    const promise = renderShareCard(data)
    promise.catch(() => {})
    cardPromise.current = promise
  }, [data])

  function getCard() {
    return cardPromise.current ?? renderShareCard(data)
  }

  async function copyCard() {
    setBusy('copy')
    setStatus(null)
    try {
      const promise = getCard()
      const copied = await copyImageToClipboard(promise)
      if (copied) {
        setStatus({ kind: 'ok', text: 'Image copied. Paste it straight into your X post.' })
        return
      }
      const blob = await promise
      downloadBlob(blob, 'fart-runner-score.png')
      setStatus({
        kind: 'warn',
        text: 'Clipboard images are blocked in this browser, so the card was downloaded instead.',
      })
    } catch {
      setStatus({ kind: 'error', text: 'Could not create the score card. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function shareCard() {
    setBusy('share')
    setStatus(null)
    try {
      const promise = getCard()

      if (!canShareImages()) {
        const copied = await copyImageToClipboard(promise)
        if (copied) {
          setStatus({ kind: 'ok', text: 'Image copied. Paste it straight into your X post.' })
          return
        }
        const blob = await promise
        downloadBlob(blob, 'fart-runner-score.png')
        setStatus({
          kind: 'warn',
          text: 'Sharing is not available here, so the card was downloaded instead.',
        })
        return
      }

      const blob = await promise
      const file = new File([blob], 'fart-runner-score.png', { type: 'image/png' })
      const shareText = `I farted ${Math.floor(distance)}m, hoovered ${beans} beans and scored ${score.toLocaleString('en-US')} in Fart Runner as @${profile?.username ?? 'mystery_farter'}. The smell is still gaining on you.`

      try {
        await navigator.share({ files: [file], title: 'Fart Runner', text: shareText })
        setStatus({ kind: 'ok', text: 'Shared. May the smell travel far.' })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setStatus(null)
          return
        }
      }

      const copied = await copyImageToClipboard(Promise.resolve(blob))
      if (copied) {
        setStatus({ kind: 'ok', text: 'Image copied. Paste it straight into your X post.' })
        return
      }
      downloadBlob(blob, 'fart-runner-score.png')
      setStatus({
        kind: 'warn',
        text: 'Sharing is not available here, so the card was downloaded instead.',
      })
    } catch {
      setStatus({ kind: 'error', text: 'Could not create the score card. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="overlay gameover-overlay">
      <div className="gameover-card">
        <div className="gameover-head">
          <p className="overlay-eyebrow">Run terminated</p>
          {isBest && <span className="best-badge">PERSONAL BEST</span>}
        </div>

        <h2 className="headline">{headline}</h2>

        <div className="score-display">
          <span className="score-label">Final score</span>
          <span className="score-number">{score.toLocaleString('en-US')}</span>
        </div>

        <div className="result-grid">
          <div className="result">
            <span>Distance</span>
            <b>{Math.floor(distance).toLocaleString('en-US')} m</b>
          </div>
          <div className="result">
            <span>Beans</span>
            <b>{beans}</b>
          </div>
          <div className="result">
            <span>Best</span>
            <b>{best.toLocaleString('en-US')}</b>
          </div>
        </div>

        {profile && (
          <div className="gameover-profile">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : null}
            <div>
              <b>@{profile.username}</b>
              <span>{profile.name}</span>
            </div>
            {profile.isDefault && <em>default character</em>}
          </div>
        )}

        <div className="overlay-actions">
          <button ref={restartRef} className="btn primary" type="button" onClick={restart}>
            RUN IT BACK
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={shareCard}
            disabled={busy !== null}
          >
            {busy === 'share' ? 'RENDERING…' : 'SHARE IMAGE'}
          </button>
          <button className="btn ghost" type="button" onClick={copyCard} disabled={busy !== null}>
            {busy === 'copy' ? 'COPYING…' : 'COPY IMAGE'}
          </button>
          <button className="btn ghost" type="button" onClick={goHome} disabled={busy !== null}>
            HOME
          </button>
        </div>

        <p className={`share-status ${status?.kind ?? ''}`} role="status" aria-live="polite">
          {status?.text ?? ''}
        </p>
      </div>
    </div>
  )
}
