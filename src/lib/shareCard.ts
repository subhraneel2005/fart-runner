import type { Profile } from '../types'

export interface ShareCardData {
  profile: Profile | null
  headline: string
  distance: number
  beans: number
  score: number
  best: number
}

const W = 1080
const H = 1350
const PAD = 80

const LIME = '#c6ff3d'
const INK = '#f4ffef'
const MUTED = 'rgba(244, 255, 239, 0.58)'
const FAINT = 'rgba(244, 255, 239, 0.32)'
const ORANGE = '#ff8a3d'
const CYAN = '#63f4ff'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string | CanvasGradient,
) {
  roundRect(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  stroke: string,
  lineWidth = 2,
) {
  roundRect(ctx, x, y, width, height, radius)
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

async function loadAvatar(src: string | null) {
  if (!src) return null
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = src
    await Promise.race([
      image.decode(),
      new Promise((_resolve, reject) => {
        window.setTimeout(() => reject(new Error('avatar timeout')), 4000)
      }),
    ])
    return image
  } catch {
    return null
  }
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  profile: Profile | null,
  image: HTMLImageElement | null,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()

  if (image) {
    const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height)
    const width = image.width * scale
    const height = image.height * scale
    ctx.drawImage(image, cx - width / 2, cy - height / 2, width, height)
  } else {
    const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
    gradient.addColorStop(0, '#2f8a67')
    gradient.addColorStop(1, '#163a4a')
    ctx.fillStyle = gradient
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    ctx.fillStyle = LIME
    ctx.font = '700 34px "Space Grotesk", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((profile?.username || 'FR').replace(/^@/, '').slice(0, 2).toUpperCase(), cx, cy + 2)
  }
  ctx.restore()

  ctx.beginPath()
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
  ctx.strokeStyle = LIME
  ctx.lineWidth = 5
  ctx.stroke()
}

function drawBean(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.38)
  ctx.beginPath()
  ctx.ellipse(0, 0, 22 * scale, 32 * scale, 0, 0, Math.PI * 2)
  ctx.fillStyle = LIME
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(8 * scale, -32 * scale, 12 * scale, 6 * scale, -0.7, 0, Math.PI * 2)
  ctx.fillStyle = CYAN
  ctx.fill()
  ctx.restore()
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  if (document.fonts) {
    await Promise.race([
      Promise.allSettled([
        document.fonts.load('400 54px "Bungee"'),
        document.fonts.load('700 34px "Space Grotesk"'),
        document.fonts.load('400 34px "Space Grotesk"'),
      ]),
      new Promise((resolve) => window.setTimeout(resolve, 1500)),
    ])
  }

  const avatar = await loadAvatar(data.profile?.avatarUrl ?? null)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create the share image.')

  ctx.fillStyle = '#060d10'
  ctx.fillRect(0, 0, W, H)

  const glowA = ctx.createRadialGradient(930, 30, 20, 930, 30, 720)
  glowA.addColorStop(0, 'rgba(38, 120, 78, 0.55)')
  glowA.addColorStop(1, 'rgba(6, 13, 16, 0)')
  ctx.fillStyle = glowA
  ctx.fillRect(0, 0, W, H)

  const glowB = ctx.createRadialGradient(90, H, 20, 90, H, 760)
  glowB.addColorStop(0, 'rgba(120, 50, 14, 0.45)')
  glowB.addColorStop(1, 'rgba(6, 13, 16, 0)')
  ctx.fillStyle = glowB
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(198, 255, 61, 0.045)'
  ctx.lineWidth = 1
  for (let x = 0; x <= W; x += 90) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += 90) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  strokeRoundRect(ctx, 40, 40, W - 80, H - 80, 46, 'rgba(198, 255, 61, 0.22)', 2)

  fillRoundRect(ctx, PAD, 80, 72, 72, 20, LIME)
  ctx.fillStyle = '#10160a'
  ctx.font = '400 30px "Bungee", "Arial Black", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('FR', PAD + 36, 118)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK
  ctx.font = '400 26px "Bungee", "Arial Black", sans-serif'
  ctx.fillText('FART RUNNER', PAD + 94, 112)
  ctx.fillStyle = FAINT
  ctx.font = '700 15px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText('GAS-POWERED ENDLESS RUNNER', PAD + 94, 138)

  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = '700 15px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText('SCORE CARD', W - PAD, 112)

  ctx.textAlign = 'left'
  ctx.fillStyle = LIME
  ctx.font = '800 19px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText('RUN TERMINATED', PAD, 258)

  let headlineSize = 54
  let headlineLines: string[] = []
  do {
    ctx.font = `400 ${headlineSize}px "Bungee", "Arial Black", sans-serif`
    headlineLines = wrapText(ctx, data.headline.toUpperCase(), W - PAD * 2)
    if (headlineLines.length <= 3) break
    headlineSize -= 3
  } while (headlineSize > 38)

  if (headlineLines.length > 3) {
    headlineLines = headlineLines.slice(0, 3)
    headlineLines[2] = `${headlineLines[2].replace(/[.,;:!?]$/, '')}…`
  }

  ctx.fillStyle = INK
  ctx.font = `400 ${headlineSize}px "Bungee", "Arial Black", sans-serif`
  let lineY = 318
  for (const line of headlineLines) {
    ctx.fillText(line, PAD, lineY)
    lineY += headlineSize * 1.16
  }

  const scoreTop = 560
  ctx.fillStyle = MUTED
  ctx.font = '800 18px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText('FINAL SCORE', PAD, scoreTop)

  if (data.score > 0 && data.score >= data.best) {
    const badgeText = 'PERSONAL BEST'
    ctx.font = '800 15px "Space Grotesk", system-ui, sans-serif'
    const badgeWidth = ctx.measureText(badgeText).width + 28
    fillRoundRect(ctx, W - PAD - badgeWidth, scoreTop - 24, badgeWidth, 34, 17, LIME)
    ctx.fillStyle = '#10160a'
    ctx.textAlign = 'center'
    ctx.fillText(badgeText, W - PAD - badgeWidth / 2, scoreTop - 1)
    ctx.textAlign = 'left'
  }

  const scoreText = data.score.toLocaleString('en-US')
  const scoreSize = scoreText.length > 6 ? 104 : scoreText.length > 4 ? 124 : 150
  ctx.save()
  ctx.shadowColor = 'rgba(198, 255, 61, 0.35)'
  ctx.shadowBlur = 36
  ctx.fillStyle = LIME
  ctx.font = `400 ${scoreSize}px "Bungee", "Arial Black", sans-serif`
  ctx.fillText(scoreText, PAD - 4, scoreTop + scoreSize + 16)
  ctx.restore()

  const statsTop = Math.max(scoreTop + scoreSize + 54, 764)
  const statWidth = (W - PAD * 2 - 24) / 3
  const stats = [
    { label: 'DISTANCE', value: `${Math.floor(data.distance).toLocaleString('en-US')} m` },
    { label: 'BEANS', value: String(data.beans) },
    { label: 'BEST', value: data.best.toLocaleString('en-US') },
  ]
  stats.forEach((stat, index) => {
    const x = PAD + index * (statWidth + 12)
    fillRoundRect(ctx, x, statsTop, statWidth, 116, 18, 'rgba(255, 255, 255, 0.035)')
    strokeRoundRect(ctx, x, statsTop, statWidth, 116, 18, 'rgba(255, 255, 255, 0.07)')
    ctx.fillStyle = FAINT
    ctx.font = '800 14px "Space Grotesk", system-ui, sans-serif'
    ctx.fillText(stat.label, x + 22, statsTop + 38)
    ctx.fillStyle = INK
    ctx.font = '700 38px "Space Grotesk", system-ui, sans-serif'
    ctx.fillText(stat.value, x + 22, statsTop + 86)
  })

  const profileTop = Math.max(statsTop + 146, 930)
  fillRoundRect(ctx, PAD, profileTop, W - PAD * 2, 132, 20, 'rgba(255, 255, 255, 0.028)')
  strokeRoundRect(ctx, PAD, profileTop, W - PAD * 2, 132, 20, 'rgba(255, 255, 255, 0.07)')
  const avatarCx = PAD + 70
  const avatarCy = profileTop + 66
  drawAvatar(ctx, data.profile, avatar, avatarCx, avatarCy, 46)

  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '700 32px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText(`@${data.profile?.username ?? 'mystery_farter'}`, PAD + 142, profileTop + 58)
  ctx.fillStyle = MUTED
  ctx.font = '400 22px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText(data.profile?.name ?? 'The Unknown Tooter', PAD + 142, profileTop + 92)

  if (data.profile?.isDefault) {
    ctx.textAlign = 'right'
    ctx.fillStyle = ORANGE
    ctx.font = '800 14px "Space Grotesk", system-ui, sans-serif'
    ctx.fillText('DEFAULT CHARACTER', W - PAD - 26, profileTop + 72)
  }

  const footerY = 1188
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, footerY)
  ctx.lineTo(W - PAD, footerY)
  ctx.stroke()

  drawBean(ctx, W - PAD - 26, footerY + 66, 1.05)

  ctx.textAlign = 'left'
  ctx.fillStyle = LIME
  ctx.font = '400 20px "Bungee", "Arial Black", sans-serif'
  ctx.fillText('FART RUNNER', PAD, footerY + 52)
  ctx.fillStyle = FAINT
  ctx.font = '700 14px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText('LET IT RIP · GAS-POWERED CHAOS', PAD, footerY + 82)

  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = '700 14px "Space Grotesk", system-ui, sans-serif'
  const host = typeof window !== 'undefined' ? window.location.host : 'fartrunner'
  ctx.fillText(host, W - PAD - 68, footerY + 52)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not export the share image.'))
    }, 'image/png')
  })
}

export function canShareImages() {
  if (typeof navigator === 'undefined' || typeof File === 'undefined') return false
  if (typeof window === 'undefined' || !window.matchMedia?.('(pointer: coarse)').matches) return false
  if (typeof navigator.canShare !== 'function') return false
  try {
    const probe = new File([new Uint8Array([0])], 'probe.png', { type: 'image/png' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export async function copyImageToClipboard(blob: Promise<Blob>) {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
