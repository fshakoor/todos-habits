import { useCallback, useEffect, useState } from 'react'
import { api, type Project, type Task, type TaskInput, type TaskPatch } from './api'

// Loads tasks and projects and exposes CRUD. Mutations update local state
// optimistically, then reconcile with whatever the server returns.
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [t, p] = await Promise.all([api.tasks(), api.projects()])
    setTasks(t)
    setProjects(p)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload().catch(() => setLoading(false))
  }, [reload])

  const addTask = useCallback(async (input: TaskInput) => {
    const created = await api.createTask(input)
    setTasks((cur) => [...cur, created])
    return created
  }, [])

  const patchTask = useCallback(async (id: number, patch: TaskPatch) => {
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...normalize(patch) } : t)))
    const saved = await api.updateTask(id, patch)
    setTasks((cur) => cur.map((t) => (t.id === id ? saved : t)))
  }, [])

  const removeTask = useCallback(async (id: number) => {
    setTasks((cur) => cur.filter((t) => t.id !== id))
    await api.removeTask(id)
  }, [])

  const clearDone = useCallback(async () => {
    setTasks((cur) => cur.filter((t) => !t.done))
    await api.clearDone()
  }, [])

  const addProject = useCallback(async (name: string, color?: string) => {
    const p = await api.createProject(name, color)
    setProjects((cur) => [...cur, p])
    return p
  }, [])

  const removeProject = useCallback(async (id: number) => {
    setProjects((cur) => cur.filter((p) => p.id !== id))
    setTasks((cur) => cur.map((t) => (t.project_id === id ? { ...t, project_id: null } : t)))
    await api.removeProject(id)
  }, [])

  return { tasks, projects, loading, reload, addTask, patchTask, removeTask, clearDone, addProject, removeProject }
}

function normalize(patch: TaskPatch): Partial<Task> {
  const out: Partial<Task> = {}
  if (patch.title !== undefined) out.title = patch.title
  if (patch.note !== undefined) out.note = patch.note
  if (patch.due_date !== undefined) out.due_date = patch.due_date
  if (patch.priority !== undefined) out.priority = patch.priority
  if (patch.project_id !== undefined) out.project_id = patch.project_id
  if (patch.position !== undefined) out.position = patch.position
  if (patch.done !== undefined) out.done = patch.done ? 1 : 0
  return out
}
