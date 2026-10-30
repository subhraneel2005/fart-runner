export type Command = 'left' | 'right' | 'jumpPress' | 'jumpRelease' | 'pause'

const queue: Command[] = []

export const input = {
  boost: false,
  push(command: Command) {
    queue.push(command)
  },
  drain() {
    return queue.splice(0, queue.length)
  },
  reset() {
    queue.length = 0
    this.boost = false
  },
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}
