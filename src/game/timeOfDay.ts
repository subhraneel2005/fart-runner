export type TimeOfDay = 'day' | 'night'

export function resolveTimeOfDay(): TimeOfDay {
  if (typeof window === 'undefined') return 'night'

  const override = new URLSearchParams(window.location.search).get('tod')
  if (override === 'day' || override === 'night') return override

  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}
