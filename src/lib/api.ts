import type { Profile } from '../types'
import { cacheProfileAvatar } from './avatarCache'
import { makeAvatarDataUrl } from './avatars'

interface XProfileResponse {
  username: string
  name: string
  avatarUrl: string | null
}

export async function fetchXProfile(username: string): Promise<Profile> {
  const clean = username.replace(/^@/, '').trim()
  const response = await fetch(`/api/x-profile?username=${encodeURIComponent(clean)}`, {
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    let message = 'Could not fetch that profile.'
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const data = (await response.json()) as XProfileResponse
  const profile: Profile = {
    username: data.username,
    name: data.name || data.username,
    avatarUrl: data.avatarUrl || makeAvatarDataUrl(data.username, data.username),
    isDefault: false,
  }
  return cacheProfileAvatar(profile)
}
