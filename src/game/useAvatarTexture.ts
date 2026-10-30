import { useEffect, useMemo, useState } from 'react'
import { CanvasTexture, SRGBColorSpace, TextureLoader, type Texture } from 'three'
import { createAvatarCanvas } from '../lib/avatars'

function focusTexture(texture: Texture) {
  texture.repeat.set(0.72, 0.88)
  texture.offset.set(0.14, 0.06)
  texture.needsUpdate = true
}

export function useAvatarTexture(url: string | null, username: string) {
  const fallback = useMemo(() => {
    const canvas =
      createAvatarCanvas(username || 'mystery_farter', username || 'FR') ??
      document.createElement('canvas')
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    focusTexture(texture)
    texture.needsUpdate = true
    return texture
  }, [username])

  const [texture, setTexture] = useState<Texture>(fallback)

  useEffect(() => {
    setTexture(fallback)
    if (!url) return

    let cancelled = false
    let loaded: Texture | null = null
    const loader = new TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (next) => {
        if (cancelled) {
          next.dispose()
          return
        }
        next.colorSpace = SRGBColorSpace
        focusTexture(next)
        next.needsUpdate = true
        loaded = next
        setTexture(next)
      },
      undefined,
      () => {
        if (!cancelled) setTexture(fallback)
      },
    )

    return () => {
      cancelled = true
      if (loaded) loaded.dispose()
    }
  }, [url, fallback])

  return texture
}
