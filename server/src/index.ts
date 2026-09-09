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

const app = Fastify({ logger: false })

app.get('/api/health', async () => ({ ok: true }))

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
