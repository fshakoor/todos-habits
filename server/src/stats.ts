import { q, type Row } from './db.js'

// The character sheet and the maths behind it. Numbers are tuned to feel like
// Habitica: gentle, with diminishing returns as a habit's value climbs.
export const MAX_HP = 50
export const DIFF: Record<string, number> = { trivial: 0.1, easy: 1, medium: 1.5, hard: 2 }

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

// xp needed to clear a given level
export function xpForLevel(level: number): number {
  return 25 * level + 25
}

// xp and gold for completing something, with a diminishing factor for high value
export function reward(difficulty: string, level: number, value: number) {
  const m = DIFF[difficulty] ?? 1
  const coef = clamp(1 - Math.max(0, value) * 0.02, 0.4, 1)
  return {
    xp: round1(m * (7 + level * 0.6) * coef),
    gold: round2(m * (2.2 + level * 0.35) * coef),
  }
}

// hp lost from a bad-habit tap or a missed daily
export function damage(difficulty: string, value: number, kind: 'habit' | 'daily') {
  const m = DIFF[difficulty] ?? 1
  const worse = clamp(1 + Math.max(0, -value) * 0.02, 1, 2)
  return round1(m * (kind === 'daily' ? 7 : 4) * worse)
}

export function getStats(): Row {
  return q.get('SELECT * FROM stats WHERE id = 1')!
}

export type Delta = { xp?: number; gold?: number; hp?: number }
export type Gained = { xp: number; gold: number; hp: number }

// Apply a change to the sheet, running level ups and the death penalty.
export function applyDelta(d: Delta): Row {
  const s = getStats()
  let level = s.level as number
  let xp = (s.xp as number) + (d.xp ?? 0)
  let gold = Math.max(0, (s.gold as number) + (d.gold ?? 0))
  let hp = Math.min(MAX_HP, (s.hp as number) + (d.hp ?? 0))

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level)
    level += 1
    hp = MAX_HP
  }
  if (hp <= 0) {
    level = Math.max(1, level - 1)
    hp = MAX_HP
    xp = 0
    gold = Math.max(0, gold - 10)
  }
  if (xp < 0) xp = 0

  q.run('UPDATE stats SET level = ?, xp = ?, hp = ?, gold = ? WHERE id = 1', level, round1(xp), round1(hp), round2(gold))
  return getStats()
}
