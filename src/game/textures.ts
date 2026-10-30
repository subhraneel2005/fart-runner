import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'

const signCache = new Map<string, Texture>()
const glowCache = new Map<string, Texture>()
const windowCache = new Map<string, Texture>()

export function makeWindowTexture(variant: 'warm' | 'cool' = 'warm') {
  const cached = windowCache.get(variant)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, 256, 256)

  const cols = 4
  const rows = 6
  const cellW = 256 / cols
  const cellH = 256 / rows
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const seed = row * 7 + col * 13 + (variant === 'warm' ? 3 : 9)
      const lit = seed % 5 !== 0
      const flicker = seed % 3 === 0 ? 0.55 : 1
      ctx.fillStyle = lit
        ? variant === 'warm'
          ? `rgba(255, 211, 138, ${0.82 * flicker})`
          : `rgba(165, 243, 255, ${0.76 * flicker})`
        : 'rgba(25, 22, 35, 0.58)'
      ctx.shadowColor = lit ? (variant === 'warm' ? '#ffb45e' : '#63f4ff') : 'transparent'
      ctx.shadowBlur = lit ? 9 : 0
      ctx.fillRect(col * cellW + 18, row * cellH + 14, cellW - 36, cellH - 28)
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(12, 10, 18, 0.75)'
      ctx.fillRect(col * cellW + 12, row * cellH + cellH - 12, cellW - 24, 6)
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  windowCache.set(variant, texture)
  return texture
}

export function makeSignTexture(text: string, background = '#ff3550', foreground = '#0a0d0c'): Texture | null {
  const key = `${text}|${background}|${foreground}`
  const cached = signCache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 512, 256)
  ctx.fillStyle = 'rgba(0,0,0,0.16)'
  for (let y = 0; y < 256; y += 32) {
    ctx.fillRect(0, y, 512, 14)
  }
  ctx.fillStyle = foreground
  ctx.font = '700 68px "Space Grotesk", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lines = text.split('\n')
  lines.forEach((line, index) => {
    ctx.fillText(line, 256, 128 + (index - (lines.length - 1) / 2) * 74)
  })
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  signCache.set(key, texture)
  return texture
}

export function makeSoftCircleTexture() {
  const cached = glowCache.get('soft')
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.65)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  glowCache.set('soft', texture)
  return texture
}


export function makeRadiationTexture() {
  const cached = glowCache.get('radiation')
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.translate(128, 128)
  ctx.fillStyle = '#c6ff3d'
  ctx.shadowColor = '#9dff57'
  ctx.shadowBlur = 18
  for (let i = 0; i < 3; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 3
    ctx.beginPath()
    ctx.arc(0, 0, 96, angle - 0.42, angle + 0.42)
    ctx.arc(0, 0, 34, angle + 0.3, angle - 0.3, true)
    ctx.closePath()
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(0, 0, 20, 0, Math.PI * 2)
  ctx.fill()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  glowCache.set('radiation', texture)
  return texture
}

export function makeGlowTexture(color: 'lime' | 'cyan' | 'orange' = 'lime') {
  const cached = glowCache.get(color)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const palette = {
    lime: ['rgba(220, 255, 160, 1)', 'rgba(150, 255, 71, 0.8)', 'rgba(120, 255, 60, 0)'],
    cyan: ['rgba(220, 255, 255, 1)', 'rgba(99, 244, 255, 0.75)', 'rgba(41, 190, 220, 0)'],
    orange: ['rgba(255, 240, 200, 1)', 'rgba(255, 138, 61, 0.8)', 'rgba(255, 90, 31, 0)'],
  }[color]
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
  gradient.addColorStop(0, palette[0])
  gradient.addColorStop(0.35, palette[1])
  gradient.addColorStop(1, palette[2])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  glowCache.set(color, texture)
  return texture
}
