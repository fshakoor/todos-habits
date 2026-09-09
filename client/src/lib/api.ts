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
}
