import type { Difficulty } from './api'

// Habit value drives a color the same way Habitica does: deep red when a habit
// has slipped, blue once it is well established.
export function valueColor(value: number): string {
  if (value >= 10) return '#4aa3ff'
  if (value >= 5) return '#22c55e'
  if (value >= 1) return '#84cc16'
  if (value > -1) return '#eab308'
  if (value > -10) return '#f97316'
  return '#ef4444'
}

export const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'trivial', label: 'Trivial' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
]

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
