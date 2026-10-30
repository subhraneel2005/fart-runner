export interface HeadlineData {
  name: string
  username: string
  distance: number
  beans: number
  score: number
}

const TEMPLATES: Array<(data: HeadlineData) => string> = [
  (d) => `${d.distance}m of pure methane. A solid effort.`,
  (d) => `${d.name} went out with a bang. Mostly gas.`,
  (d) => `Beans consumed: ${d.beans}. Dignity: unavailable.`,
  () => 'The beans remember what you did.',
  (d) => `You cleared ${d.distance}m before the tank ran dry.`,
  () => 'A truly legendary rip. Some say it is still going.',
  () => 'Certified gas guzzler. Please air out the leaderboard.',
  () => 'Your fart had a good run. You did not.',
  () => 'Somewhere, a bean farmer is quietly proud.',
  () => 'The wind was not the only thing breaking today.',
  () => 'You left a trail. We are not cleaning it.',
  (d) => `Distance: ${d.distance}m. Vibes: rancid.`,
  (d) => `${d.score} points of weaponized flatulence.`,
  () => 'The rocket has left the atmosphere. So has the smell.',
  () => 'A moment of silence for everyone behind you.',
  () => 'Your gas bill is through the roof.',
  () => 'You did not finish first, but you finished loudest.',
  () => 'Air traffic control has several questions.',
  (d) => `@${d.username} has been banned from the buffet.`,
  () => 'It started with a spark. It ended with a stench.',
  () => 'Legends never die. They just dissipate.',
  (d) => `${d.distance}m later, the smell is still gaining on you.`,
  () => 'That was not a sprint. That was a chemical incident.',
  (d) => `${d.beans} beans gave their lives for this.`,
  () => 'NASA called. They want their propulsion system back.',
  () => 'You tooted. You hooted. You left a cloud.',
]

export function pickHeadline(data: HeadlineData) {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
  return template(data)
}
