import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'
// load repo-root .env explicitly (the server is launched from the workspace dir)
dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') })

import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import './db.js'
import { clearDone, createTask, deleteTask, listTasks, taskInput, taskPatch, updateTask } from './tasks.js'
import { createProject, deleteProject, listProjects, projectInput, updateProject } from './projects.js'
import { createHabit, deleteHabit, habitInput, listHabits, tapHabit, updateHabit } from './habits.js'
import { checkDaily, createDaily, dailyInput, deleteDaily, listDailies, updateDaily } from './dailies.js'
import { getStats } from './stats.js'
import { runCron } from './cron.js'

const app = Fastify({ logger: false })

app.get('/api/health', async () => ({ ok: true }))

// habit tracker: the whole board in one shot (runs the daily rollover first)
app.get('/api/board', async () => {
  runCron()
  return { stats: getStats(), habits: listHabits(), dailies: listDailies() }
})

// habits
app.post('/api/habits', async (req, reply) => {
  const parsed = habitInput.safeParse(req.body)
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'invalid' })
  return createHabit(parsed.data)
})

app.put('/api/habits/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  const h = updateHabit(id, req.body as Record<string, unknown>)
  if (!h) return reply.code(404).send({ error: 'not found' })
  return h
})

app.delete('/api/habits/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  if (!deleteHabit(id)) return reply.code(404).send({ error: 'not found' })
  return { ok: true }
})

app.post('/api/habits/:id/tap', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  const dir = (req.body as { direction?: number }).direction === -1 ? -1 : 1
  const out = tapHabit(id, dir)
  if (!out) return reply.code(404).send({ error: 'not found' })
  return out
})

// dailies
app.post('/api/dailies', async (req, reply) => {
  const parsed = dailyInput.safeParse(req.body)
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'invalid' })
  return createDaily(parsed.data)
})

app.put('/api/dailies/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  const d = updateDaily(id, req.body as Record<string, unknown>)
  if (!d) return reply.code(404).send({ error: 'not found' })
  return d
})

app.delete('/api/dailies/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  if (!deleteDaily(id)) return reply.code(404).send({ error: 'not found' })
  return { ok: true }
})

app.post('/api/dailies/:id/check', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  const done = (req.body as { done?: boolean }).done !== false
  const out = checkDaily(id, done)
  if (!out) return reply.code(404).send({ error: 'not found' })
  return out
})

// projects
app.get('/api/projects', async () => listProjects())

app.post('/api/projects', async (req, reply) => {
  const parsed = projectInput.safeParse(req.body)
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'invalid' })
  return createProject(parsed.data)
})

app.put('/api/projects/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  const p = updateProject(id, req.body as Record<string, unknown>)
  if (!p) return reply.code(404).send({ error: 'not found' })
  return p
})

app.delete('/api/projects/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  if (!deleteProject(id)) return reply.code(404).send({ error: 'not found' })
  return { ok: true }
})

// tasks
app.get('/api/tasks', async () => listTasks())

app.post('/api/tasks', async (req, reply) => {
  const parsed = taskInput.safeParse(req.body)
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'invalid' })
  return createTask(parsed.data)
})

app.put('/api/tasks/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  const parsed = taskPatch.safeParse(req.body)
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'invalid' })
  const t = updateTask(id, parsed.data)
  if (!t) return reply.code(404).send({ error: 'not found' })
  return t
})

app.delete('/api/tasks/:id', async (req, reply) => {
  const id = Number((req.params as { id: string }).id)
  if (!deleteTask(id)) return reply.code(404).send({ error: 'not found' })
  return { ok: true }
})

app.post('/api/tasks/clear-done', async () => ({ cleared: clearDone() }))

// serve the built client in production (single port over Tailscale)
const distDir = path.resolve(import.meta.dirname, '../../client/dist')
const hasDist = fs.existsSync(path.join(distDir, 'index.html'))
if (hasDist) {
  await app.register(fastifyStatic, { root: distDir })
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'not found' })
    return reply.sendFile('index.html') // SPA fallback
  })
}

const port = Number(process.env.PORT || 5180)
// In prod (serving the client) bind on all interfaces so tailnet devices can reach it.
// In dev the API stays on localhost; the Vite client proxies /api to it.
const host = process.env.HOST || (hasDist ? '0.0.0.0' : '127.0.0.1')

app.listen({ port, host }).then(() => {
  console.log(`[todos-habits] api on http://${host}:${port}${hasDist ? '  (also serving the client)' : ''}`)
})
