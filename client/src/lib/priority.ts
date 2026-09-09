// Stored priority runs 4 (urgent) down to 1 (none), matching Todoist's p1..p4.
export const PRIORITIES = [
  { value: 4, label: 'P1', color: '#ef4444' },
  { value: 3, label: 'P2', color: '#f59e0b' },
  { value: 2, label: 'P3', color: '#3b82f6' },
  { value: 1, label: 'P4', color: '' },
] as const

export function priorityColor(p: number): string {
  return PRIORITIES.find((x) => x.value === p)?.color || ''
}
