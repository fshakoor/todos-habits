import { addDays, toKey } from './date'

// Parse a raw quick-add string into a task. Pulls a due date and a priority out
// of the text and hands back a cleaned title, roughly the way Todoist does it:
//   "email dan tomorrow p1" -> { title: "email dan", due_date: <tmr>, priority: 4 }

export type Parsed = { title: string; due_date: string | null; priority: number }

const DOW: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
}

function comingWeekday(todayKey: string, target: number, next: boolean): string {
  const dow = new Date(todayKey + 'T00:00:00').getDay()
  let ahead = (target - dow + 7) % 7
  if (next) ahead = ahead === 0 ? 7 : ahead + 7
  return addDays(todayKey, ahead)
}

export function parseQuickAdd(raw: string, todayKey: string): Parsed {
  let text = ` ${raw} `
  let due: string | null = null
  let priority = 1

  // priority: p1..p4 (p1 is most urgent, stored as 4)
  text = text.replace(/\s(?:p|!)([1-4])\b/i, (_m, n) => {
    priority = 5 - Number(n)
    return ' '
  })

  const setDue = (key: string) => () => {
    if (!due) due = key
    return ' '
  }

  // iso date
  text = text.replace(/\s(\d{4}-\d{2}-\d{2})\b/, (_m, d) => {
    if (!due) due = d
    return ' '
  })

  // relative words
  text = text.replace(/\s(today|tod)\b/i, setDue(todayKey))
  text = text.replace(/\s(tomorrow|tmrw?|tom)\b/i, setDue(addDays(todayKey, 1)))
  text = text.replace(/\snext\s+week\b/i, setDue(addDays(todayKey, 7)))

  // in N day(s)/week(s)
  text = text.replace(/\sin\s+(\d{1,3})\s+(day|days|week|weeks)\b/i, (_m, n, unit) => {
    if (!due) due = addDays(todayKey, Number(n) * (/week/i.test(unit) ? 7 : 1))
    return ' '
  })

  // (next) weekday
  text = text.replace(/\s(next\s+)?(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|weds|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)\b/i,
    (_m, next, name) => {
      if (!due) due = comingWeekday(todayKey, DOW[String(name).toLowerCase()], Boolean(next))
      return ' '
    })

  // "sep 20" or "20 sep" (optional year, optional comma)
  text = text.replace(/\s([a-z]{3,9})\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i, (m, mon, day, yr) => {
    const mi = MONTHS[String(mon).toLowerCase()]
    if (mi === undefined || due) return m
    const year = yr ? Number(yr) : new Date(todayKey + 'T00:00:00').getFullYear()
    due = toKey(new Date(year, mi, Number(day)))
    return ' '
  })
  text = text.replace(/\s(\d{1,2})\s+([a-z]{3,9})\b/i, (m, day, mon) => {
    const mi = MONTHS[String(mon).toLowerCase()]
    if (mi === undefined || due) return m
    due = toKey(new Date(new Date(todayKey + 'T00:00:00').getFullYear(), mi, Number(day)))
    return ' '
  })

  const title = text.replace(/\s+/g, ' ').trim()
  return { title: title || raw.trim(), due_date: due, priority }
}
