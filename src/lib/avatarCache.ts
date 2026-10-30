import type { Profile } from '../types'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read avatar'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read avatar'))
    reader.readAsDataURL(blob)
  })
}

export async function cacheProfileAvatar(profile: Profile): Promise<Profile> {
  const source = profile.avatarUrl
  if (!source || source.startsWith('data:')) return profile

  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(7000) })
    if (!response.ok) return profile
    const type = response.headers.get('content-type') || 'image/jpeg'
    if (!type.startsWith('image/')) return profile
    const blob = await response.blob()
    if (blob.size > MAX_AVATAR_BYTES) return profile
    const dataUrl = await blobToDataUrl(blob)
    return { ...profile, avatarUrl: dataUrl }
  } catch {
    return profile
  }
}
