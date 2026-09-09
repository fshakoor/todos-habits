import { z } from 'zod'
import { q, type Row } from './db.js'
import { applyDelta, getStats, reward, type Gained } from './stats.js'
import { addDays, todayKey, weekday } from './time.js'

export const dailyInput = z.object({
  name: z.string().trim().min(1).max(200),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).optional(),
  days: z.array(z.number().int().min(0).max(6)).optional(),
})

const HISTORY_DAYS = 21

function decorate(d: Row): Row {
  const today = todayKey()
  const days: number[] = JSON.parse(d.days)
  const doneToday = !!q.get('SELECT 1 FROM daily_checks WHERE daily_id = ? AND date = ?', d.id, today)
  const history: { date: string; due: boolean; done: boolean }[] = []
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    history.push({
      date,
      due: days.includes(weekday(date)),
      done: !!q.get('SELECT 1 FROM daily_checks WHERE daily_id = ? AND date = ?', d.id, date),
    })
  }
  return { ...d, days, due_today: days.includes(weekday(today)), done_today: doneToday, history }
}

export function listDailies(): Row[] {
  return q.all('SELECT * FROM dailies ORDER BY position, id').map(decorate)
}

export function createDaily(data: z.infer<typeof dailyInput>): Row {
  const max = q.get('SELECT MAX(position) AS m FROM dailies')?.m ?? 0
  const { lastInsertRowid } = q.run(
    'INSERT INTO dailies (name, difficulty, days, position, created) VALUES (?, ?, ?, ?, ?)',
    data.name,
    data.difficulty ?? 'easy',
    JSON.stringify(data.days ?? [0, 1, 2, 3, 4, 5, 6]),
    Number(max) + 1,
    Date.now(),
  )
  return decorate(q.get('SELECT * FROM dailies WHERE id = ?', lastInsertRowid)!)
}

export function updateDaily(id: number, data: Record<string, unknown>): Row | undefined {
  const cur = q.get('SELECT * FROM dailies WHERE id = ?', id)
  if (!cur) return undefined
  const next = { ...cur, ...data }
  const days = Array.isArray(next.days) ? JSON.stringify(next.days) : next.days
  q.run('UPDATE dailies SET name = ?, difficulty = ?, days = ?, position = ? WHERE id = ?', next.name, next.difficulty, days, next.position, id)
  return decorate(q.get('SELECT * FROM dailies WHERE id = ?', id)!)
}

export function deleteDaily(id: number): boolean {
  return q.run('DELETE FROM dailies WHERE id = ?', id).changes > 0
}

// Check or uncheck today's occurrence, moving the streak and the reward with it.
export function checkDaily(id: number, done: boolean): { daily: Row; stats: Row; gained: Gained } | undefined {
  const d = q.get('SELECT * FROM dailies WHERE id = ?', id)
  if (!d) return undefined
  const today = todayKey()
  const already = !!q.get('SELECT 1 FROM daily_checks WHERE daily_id = ? AND date = ?', id, today)

  let stats = getStats()
  let gained: Gained = { xp: 0, gold: 0, hp: 0 }
  if (done && !already) {
    q.run('INSERT INTO daily_checks (daily_id, date) VALUES (?, ?)', id, today)
    q.run('UPDATE dailies SET streak = streak + 1 WHERE id = ?', id)
    const r = reward(d.difficulty, stats.level as number, 0)
    gained = { xp: r.xp, gold: r.gold, hp: 0 }
    stats = applyDelta({ xp: r.xp, gold: r.gold })
  } else if (!done && already) {
    q.run('DELETE FROM daily_checks WHERE daily_id = ? AND date = ?', id, today)
    q.run('UPDATE dailies SET streak = MAX(0, streak - 1) WHERE id = ?', id)
    const r = reward(d.difficulty, stats.level as number, 0)
    gained = { xp: -r.xp, gold: -r.gold, hp: 0 }
    stats = applyDelta({ xp: -r.xp, gold: -r.gold })
  }

  return { daily: decorate(q.get('SELECT * FROM dailies WHERE id = ?', id)!), stats, gained }
}
