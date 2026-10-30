function hashSeed(seed: string) {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createAvatarCanvas(seed: string, label = 'FR'): HTMLCanvasElement | null {
  const hue = hashSeed(seed) % 360
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = ctx.createLinearGradient(0, 0, 256, 256)
  bg.addColorStop(0, `hsl(${hue}, 78%, 58%)`)
  bg.addColorStop(1, `hsl(${(hue + 70) % 360}, 82%, 34%)`)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 256, 256)

  ctx.globalAlpha = 0.25
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath()
    ctx.arc(
      30 + ((hashSeed(seed + i) % 200) + i * 3),
      20 + (hashSeed(seed + i * 7) % 216),
      18 + (i % 3) * 8,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const skin = `hsl(${(hue + 35) % 360}, 70%, ${64 + (hashSeed(seed) % 12)}%)`
  ctx.beginPath()
  ctx.ellipse(128, 140, 78, 86, 0, 0, Math.PI * 2)
  ctx.fillStyle = skin
  ctx.fill()

  ctx.fillStyle = '#17211b'
  ctx.beginPath()
  ctx.ellipse(100, 126, 11, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(156, 126, 11, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(104, 121, 3.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(160, 121, 3.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#17211b'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(128, 152, 34, 0.18 * Math.PI, 0.82 * Math.PI)
  ctx.stroke()

  ctx.fillStyle = 'rgba(23, 33, 27, 0.18)'
  ctx.beginPath()
  ctx.ellipse(128, 206, 52, 16, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(7, 13, 14, 0.72)'
  ctx.font = '700 30px "Space Grotesk", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const tag = label.replace(/^@/, '').slice(0, 2).toUpperCase() || 'FR'
  ctx.fillText(tag, 128, 224)

  return canvas
}

export function makeAvatarDataUrl(seed: string, label = 'FR') {
  const canvas = createAvatarCanvas(seed, label)
  return canvas ? canvas.toDataURL('image/png') : ''
}

export function defaultProfile(username: string, fallbackName?: string) {
  const clean = username.replace(/^@/, '').trim()
  const handle = clean || 'mystery_farter'
  return {
    username: handle,
    name: fallbackName || (clean ? clean : 'The Unknown Tooter'),
    avatarUrl: makeAvatarDataUrl(handle, clean || 'FR'),
    isDefault: true,
  }
}
