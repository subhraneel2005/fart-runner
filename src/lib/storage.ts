import type { Profile } from '../types'

const PROFILE_KEY = 'fart-runner-profile'

function isSafeAvatar(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return (
    value.startsWith('data:image/') ||
    value.startsWith('/api/avatar') ||
    value.startsWith('https://pbs.twimg.com/')
  )
}

export function loadSavedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<Profile>
    if (typeof data.username !== 'string' || !data.username.trim()) return null
    return {
      username: data.username.replace(/^@/, '').trim(),
      name: typeof data.name === 'string' && data.name.trim() ? data.name : data.username,
      avatarUrl: isSafeAvatar(data.avatarUrl) ? data.avatarUrl : null,
      isDefault: Boolean(data.isDefault),
    }
  } catch {
    return null
  }
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    /* storage may be unavailable */
  }
}

export function clearSavedProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY)
  } catch {
    /* ignore */
  }
}
