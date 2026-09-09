export type Project = {
  id: number
  name: string
  color: string
  position: number
  created: number
}

export type Task = {
  id: number
  project_id: number | null
  title: string
  note: string | null
  due_date: string | null // YYYY-MM-DD
  priority: number // 4 = urgent (p1) .. 1 = none (p4)
  done: number // 0 | 1
  completed_at: number | null
  position: number
  created: number
}

export type TaskInput = {
  title: string
  note?: string | null
  due_date?: string | null
  priority?: number
  project_id?: number | null
}

export type TaskPatch = Partial<TaskInput> & { done?: boolean; position?: number }

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard'

export type Stats = {
  id: number
  level: number
  xp: number
  hp: number
  max_hp: number
  gold: number
  last_cron: string | null
}

export type Habit = {
  id: number
  name: string
  up: number
  down: number
  value: number
  difficulty: Difficulty
  position: number
  created: number
  up_today: number
  down_today: number
}

export type DayCell = { date: string; due: boolean; done: boolean }

export type Daily = {
  id: number
  name: string
  difficulty: Difficulty
  days: number[]
  streak: number
  position: number
  created: number
  due_today: boolean
  done_today: boolean
  history: DayCell[]
}

export type Board = { stats: Stats; habits: Habit[]; dailies: Daily[] }
export type Gained = { xp: number; gold: number; hp: number }

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

export const api = {
  // projects
  projects: () => fetch('/api/projects').then((r) => j<Project[]>(r)),
  createProject: (name: string, color?: string) => send('/api/projects', 'POST', { name, color }).then((r) => j<Project>(r)),
  updateProject: (id: number, patch: Partial<Project>) => send(`/api/projects/${id}`, 'PUT', patch).then((r) => j<Project>(r)),
  removeProject: (id: number) => send(`/api/projects/${id}`, 'DELETE').then((r) => j<{ ok: true }>(r)),

  // tasks
  tasks: () => fetch('/api/tasks').then((r) => j<Task[]>(r)),
  createTask: (t: TaskInput) => send('/api/tasks', 'POST', t).then((r) => j<Task>(r)),
  updateTask: (id: number, patch: TaskPatch) => send(`/api/tasks/${id}`, 'PUT', patch).then((r) => j<Task>(r)),
  removeTask: (id: number) => send(`/api/tasks/${id}`, 'DELETE').then((r) => j<{ ok: true }>(r)),
  clearDone: () => send('/api/tasks/clear-done', 'POST').then((r) => j<{ cleared: number }>(r)),

  // habit tracker
  board: () => fetch('/api/board').then((r) => j<Board>(r)),
  createHabit: (h: { name: string; up?: boolean; down?: boolean; difficulty?: Difficulty }) =>
    send('/api/habits', 'POST', h).then((r) => j<Habit>(r)),
  updateHabit: (id: number, patch: Partial<Habit>) => send(`/api/habits/${id}`, 'PUT', patch).then((r) => j<Habit>(r)),
  removeHabit: (id: number) => send(`/api/habits/${id}`, 'DELETE').then((r) => j<{ ok: true }>(r)),
  tapHabit: (id: number, direction: 1 | -1) =>
    send(`/api/habits/${id}/tap`, 'POST', { direction }).then((r) => j<{ habit: Habit; stats: Stats; gained: Gained }>(r)),

  createDaily: (d: { name: string; difficulty?: Difficulty; days?: number[] }) =>
    send('/api/dailies', 'POST', d).then((r) => j<Daily>(r)),
  updateDaily: (id: number, patch: Partial<Daily>) => send(`/api/dailies/${id}`, 'PUT', patch).then((r) => j<Daily>(r)),
  removeDaily: (id: number) => send(`/api/dailies/${id}`, 'DELETE').then((r) => j<{ ok: true }>(r)),
  checkDaily: (id: number, done: boolean) =>
    send(`/api/dailies/${id}/check`, 'POST', { done }).then((r) => j<{ daily: Daily; stats: Stats; gained: Gained }>(r)),
}
