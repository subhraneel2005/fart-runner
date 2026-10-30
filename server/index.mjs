import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const isProd = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 8787)

const app = express()
app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  next()
})

const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/
const PROFILE_TTL = 10 * 60 * 1000
const profileCache = new Map()

const hits = new Map()
function rateLimit(req, res, next) {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + 60_000 })
    return next()
  }
  entry.count += 1
  if (entry.count > 40) {
    res.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1000)))
    return res.status(429).json({ error: 'Slow down. Too many profile lookups.' })
  }
  next()
}

let tokenCache = { token: '', expiresAt: 0 }

async function getBearerToken() {
  if (process.env.X_BEARER_TOKEN) return process.env.X_BEARER_TOKEN
  const key = process.env.X_CONSUMER_KEY
  const secret = process.env.X_SECRET_KEY
  if (!key || !secret) return null
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token

  const basic = Buffer.from(`${key}:${secret}`).toString('base64')
  const response = await fetch('https://api.x.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: 'grant_type=client_credentials',
  })
  if (!response.ok) return null
  const data = await response.json()
  if (!data.access_token) return null
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in || 900) - 90) * 1000,
  }
  return tokenCache.token
}

function normalizeAvatar(url) {
  if (!url) return null
  return url.replace(/_normal(\.[a-zA-Z]+)$/, '_400x400$1')
}

function profilePayload(user, source) {
  const avatar = normalizeAvatar(user.avatar_url || user.profile_image_url)
  return {
    username: user.screen_name || user.username,
    name: user.name || user.screen_name || user.username,
    avatarUrl: avatar ? `/api/avatar?u=${encodeURIComponent(avatar)}` : null,
    source,
  }
}

async function fetchPublicMirror(username) {
  if (process.env.PROFILE_FALLBACK === '0') return null
  try {
    const response = await fetch(`https://api.fxtwitter.com/${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'FartRunner/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    const data = await response.json()
    if (!data?.user?.screen_name) return null
    return profilePayload(data.user, 'public-mirror')
  } catch {
    return null
  }
}

function cacheProfile(cacheKey, payload) {
  profileCache.set(cacheKey, { payload, expiresAt: Date.now() + PROFILE_TTL })
  return payload
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    xApi: Boolean(process.env.X_BEARER_TOKEN || (process.env.X_CONSUMER_KEY && process.env.X_SECRET_KEY)),
  })
})

app.get('/api/x-profile', rateLimit, async (req, res) => {
  const username = String(req.query.username || '').replace(/^@/, '').trim()
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'That username does not look right.' })
  }

  const cacheKey = username.toLowerCase()
  const cached = profileCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.payload)
  }

  const token = await getBearerToken().catch(() => null)
  if (!token) {
    const mirror = await fetchPublicMirror(username)
    if (mirror) return res.json(cacheProfile(cacheKey, mirror))
    return res.status(503).json({ error: 'X access is not configured. Running with a default character.' })
  }

  try {
    const url = new URL(`https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`)
    url.searchParams.set('user.fields', 'profile_image_url,name,username')
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4500),
    })

    if (!response.ok) {
      console.error('X profile request failed', response.status, await response.text().catch(() => ''))
      const mirror = await fetchPublicMirror(username)
      if (mirror) return res.json(cacheProfile(cacheKey, mirror))
      if (response.status === 404) {
        return res.status(404).json({ error: 'No X account by that name.' })
      }
      if (response.status === 401 || response.status === 403 || response.status === 402) {
        return res.status(403).json({ error: 'X would not share that profile. Playing as a mystery farter.' })
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'X rate-limited us. Try again in a minute.' })
      }
      return res.status(502).json({ error: 'X is not sharing profiles right now. Playing as a mystery farter.' })
    }

    const data = await response.json()
    const user = data?.data
    if (!user?.username) {
      const mirror = await fetchPublicMirror(username)
      if (mirror) return res.json(cacheProfile(cacheKey, mirror))
      return res.status(404).json({ error: 'No X account by that name.' })
    }

    const payload = profilePayload(user, 'x')
    cacheProfile(cacheKey, payload)
    res.json(payload)
  } catch (error) {
    console.error('X profile lookup failed', error)
    const mirror = await fetchPublicMirror(username)
    if (mirror) return res.json(cacheProfile(cacheKey, mirror))
    res.status(502).json({ error: 'Could not reach X. Running with a default character.' })
  }
})

app.get('/api/avatar', async (req, res) => {
  const raw = String(req.query.u || '')
  let target
  try {
    target = new URL(raw)
  } catch {
    return res.status(400).json({ error: 'Bad avatar URL.' })
  }
  if (target.protocol !== 'https:' || !['pbs.twimg.com', 'abs.twimg.com'].includes(target.hostname)) {
    return res.status(400).json({ error: 'Avatar host not allowed.' })
  }

  try {
    const response = await fetch(target, {
      headers: { 'User-Agent': 'FartRunner/1.0' },
      signal: AbortSignal.timeout(7000),
    })
    if (!response.ok) return res.status(404).end()
    const type = response.headers.get('content-type') || ''
    if (!type.startsWith('image/')) return res.status(415).end()
    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (declaredLength > 4 * 1024 * 1024) return res.status(413).end()
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > 4 * 1024 * 1024) return res.status(413).end()
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.send(buffer)
  } catch {
    res.status(502).end()
  }
})

if (isProd) {
  const dist = path.join(root, 'dist')
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'spa',
  })
  app.use(vite.middlewares)
}

app.listen(port, () => {
  console.log(`\n  Fart Runner ${isProd ? 'production' : 'dev'} server → http://localhost:${port}\n`)
})
