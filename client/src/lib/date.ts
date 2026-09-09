// All dates are handled as local YYYY-MM-DD strings so there are no timezone surprises.

export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return toKey(new Date())
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function weekday(key: string): number {
  return fromKey(key).getDay() // 0 = Sunday
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Human label for a due date, relative to today.
export function dueLabel(key: string): string {
  const t = today()
  if (key === t) return 'Today'
  if (key === addDays(t, 1)) return 'Tomorrow'
  if (key === addDays(t, -1)) return 'Yesterday'
  const d = fromKey(key)
  const withinWeek = Math.abs((fromKey(key).getTime() - fromKey(t).getTime()) / 86400000)
  if (withinWeek < 7 && key > t) return DOW[d.getDay()]
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${sameYear ? '' : `, ${d.getFullYear()}`}`
}

export function isOverdue(key: string): boolean {
  return key < today()
}
