import { z } from 'zod'
import { q, type Row } from './db.js'
import { applyDelta, damage, reward } from './stats.js'
import { todayKey } from './time.js'

export const habitInput = z.object({
  name: z.string().trim().min(1).max(200),
  up: z.boolean().optional(),
  down: z.boolean().optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).optional(),
})

// attach today's + and - tap counts so the UI can show them
function withCounts(h: Row): Row {
  const today = todayKey()
  const up = q.get('SELECT COUNT(*) AS n FROM habit_events WHERE habit_id = ? AND date = ? AND direction = 1', h.id, today)?.n ?? 0
  const down = q.get('SELECT COUNT(*) AS n FROM habit_events WHERE habit_id = ? AND date = ? AND direction = -1', h.id, today)?.n ?? 0
  return { ...h, up_today: Number(up), down_today: Number(down) }
}

export function listHabits(): Row[] {
  return q.all('SELECT * FROM habits ORDER BY position, id').map(withCounts)
}

export function createHabit(data: z.infer<typeof habitInput>): Row {
  const max = q.get('SELECT MAX(position) AS m FROM habits')?.m ?? 0
  const { lastInsertRowid } = q.run(
    'INSERT INTO habits (name, up, down, difficulty, position, created) VALUES (?, ?, ?, ?, ?, ?)',
    data.name,
    data.up === false ? 0 : 1,
    data.down === false ? 0 : 1,
    data.difficulty ?? 'easy',
    Number(max) + 1,
    Date.now(),
  )
  return withCounts(q.get('SELECT * FROM habits WHERE id = ?', lastInsertRowid)!)
}

export function updateHabit(id: number, data: Record<string, unknown>): Row | undefined {
  const cur = q.get('SELECT * FROM habits WHERE id = ?', id)
  if (!cur) return undefined
  const next = { ...cur, ...data }
  q.run(
    'UPDATE habits SET name = ?, up = ?, down = ?, difficulty = ?, position = ? WHERE id = ?',
    next.name,
    typeof next.up === 'boolean' ? (next.up ? 1 : 0) : next.up,
    typeof next.down === 'boolean' ? (next.down ? 1 : 0) : next.down,
    next.difficulty,
    next.position,
    id,
  )
  return withCounts(q.get('SELECT * FROM habits WHERE id = ?', id)!)
}

export function deleteHabit(id: number): boolean {
  return q.run('DELETE FROM habits WHERE id = ?', id).changes > 0
}

// A + or - tap: move the habit's value, then reward or ding the character.
export function tapHabit(id: number, direction: 1 | -1): { habit: Row; stats: Row } | undefined {
  const h = q.get('SELECT * FROM habits WHERE id = ?', id)
  if (!h) return undefined
  const value = h.value as number

  let stats: Row
  if (direction === 1) {
    const r = reward(h.difficulty, (getLevel()), value)
    stats = applyDelta({ xp: r.xp, gold: r.gold })
  } else {
    stats = applyDelta({ hp: -damage(h.difficulty, value, 'habit') })
  }

  q.run('UPDATE habits SET value = ? WHERE id = ?', value + direction, id)
  q.run('INSERT INTO habit_events (habit_id, date, direction, created) VALUES (?, ?, ?, ?)', id, todayKey(), direction, Date.now())

  return { habit: withCounts(q.get('SELECT * FROM habits WHERE id = ?', id)!), stats }
}

function getLevel(): number {
  return Number(q.get('SELECT level FROM stats WHERE id = 1')?.level ?? 1)
}
