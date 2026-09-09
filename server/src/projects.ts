import { z } from 'zod'
import { q } from './db.js'

export const projectInput = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().max(20).optional(),
})

export function listProjects() {
  return q.all('SELECT * FROM projects ORDER BY position, id')
}

export function createProject(data: z.infer<typeof projectInput>) {
  const max = q.get('SELECT MAX(position) AS m FROM projects')?.m ?? 0
  const { lastInsertRowid } = q.run(
    'INSERT INTO projects (name, color, position, created) VALUES (?, ?, ?, ?)',
    data.name,
    data.color ?? 'gray',
    Number(max) + 1,
    Date.now(),
  )
  return q.get('SELECT * FROM projects WHERE id = ?', lastInsertRowid)
}

export function updateProject(id: number, data: Record<string, unknown>) {
  const cur = q.get('SELECT * FROM projects WHERE id = ?', id)
  if (!cur) return undefined
  const next = { ...cur, ...data }
  q.run('UPDATE projects SET name = ?, color = ?, position = ? WHERE id = ?', next.name, next.color, next.position, id)
  return q.get('SELECT * FROM projects WHERE id = ?', id)
}

export function deleteProject(id: number) {
  return q.run('DELETE FROM projects WHERE id = ?', id).changes > 0
}
