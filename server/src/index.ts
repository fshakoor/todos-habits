import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'
// load repo-root .env explicitly (the server is launched from the workspace dir)
dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') })

import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import './db.js'

const app = Fastify({ logger: false })

app.get('/api/health', async () => ({ ok: true }))

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
