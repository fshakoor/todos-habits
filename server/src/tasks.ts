import { z } from 'zod'
import { q } from './db.js'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const taskInput = z.object({
  title: z.string().trim().min(1).max(500),
  note: z.string().max(2000).nullish(),
  due_date: dateStr.nullish(),
  priority: z.number().int().min(1).max(4).optional(),
  project_id: z.number().int().nullish(),
})

// partial update, every field optional
export const taskPatch = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  note: z.string().max(2000).nullish(),
  due_date: dateStr.nullish(),
  priority: z.number().int().min(1).max(4).optional(),
  project_id: z.number().int().nullish(),
  done: z.boolean().optional(),
  position: z.number().optional(),
})

export function listTasks() {
  return q.all('SELECT * FROM tasks ORDER BY done, position, id')
}

export function createTask(data: z.infer<typeof taskInput>) {
  const max = q.get('SELECT MAX(position) AS m FROM tasks')?.m ?? 0
  const { lastInsertRowid } = q.run(
    'INSERT INTO tasks (project_id, title, note, due_date, priority, position, created) VALUES (?, ?, ?, ?, ?, ?, ?)',
    data.project_id ?? null,
    data.title,
    data.note ?? null,
    data.due_date ?? null,
    data.priority ?? 1,
    Number(max) + 1,
    Date.now(),
  )
  return q.get('SELECT * FROM tasks WHERE id = ?', lastInsertRowid)
}

export function updateTask(id: number, data: z.infer<typeof taskPatch>) {
  const cur = q.get('SELECT * FROM tasks WHERE id = ?', id)
  if (!cur) return undefined
  const next = { ...cur, ...data }
  if (data.done !== undefined) {
    next.done = data.done ? 1 : 0
    next.completed_at = data.done ? Date.now() : null
  }
  q.run(
    `UPDATE tasks SET project_id = ?, title = ?, note = ?, due_date = ?, priority = ?, done = ?, completed_at = ?, position = ?
     WHERE id = ?`,
    next.project_id,
    next.title,
    next.note,
    next.due_date,
    next.priority,
    next.done,
    next.completed_at,
    next.position,
    id,
  )
  return q.get('SELECT * FROM tasks WHERE id = ?', id)
}

export function deleteTask(id: number) {
  return q.run('DELETE FROM tasks WHERE id = ?', id).changes > 0
}

// clear out finished tasks in one go
export function clearDone() {
  return q.run('DELETE FROM tasks WHERE done = 1').changes
}
