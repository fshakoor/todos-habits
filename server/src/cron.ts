import { q } from './db.js'
import { applyDelta, damage, getStats } from './stats.js'
import { addDays, todayKey, weekday } from './time.js'

// Daily rollover. Runs lazily on reads: for every scheduled day that has fully
// passed since we last checked, any daily left unchecked costs HP and breaks its
// streak. The current day is left alone since it is still in progress.
export function runCron(): void {
  const s = getStats()
  const today = todayKey()
  const last = s.last_cron as string | null

  if (!last) {
    q.run('UPDATE stats SET last_cron = ? WHERE id = 1', today)
    return
  }
  if (last >= today) return

  const dailies = q.all('SELECT * FROM dailies')
  for (let day = addDays(last, 0); day < today; day = addDays(day, 1)) {
    const dow = weekday(day)
    for (const d of dailies) {
      const days: number[] = JSON.parse(d.days)
      if (!days.includes(dow)) continue // not scheduled that day
      const checked = q.get('SELECT 1 FROM daily_checks WHERE daily_id = ? AND date = ?', d.id, day)
      if (!checked) {
        applyDelta({ hp: -damage(d.difficulty, 0, 'daily') })
        q.run('UPDATE dailies SET streak = 0 WHERE id = ?', d.id)
      }
    }
  }
  q.run('UPDATE stats SET last_cron = ? WHERE id = 1', today)
}
