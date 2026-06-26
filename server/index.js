import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createPilot,
  createSignal,
  getState,
  initDatabase,
  recordActivity,
  resetDemoState,
  toggleVote,
  updateSignalStatus,
} from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const distIndex = path.join(distDir, 'index.html')
const app = express()
const port = Number(process.env.PORT || 8787)
const allowedStatuses = new Set(['new', 'triaged', 'pilot', 'resolved'])
const allowedTypes = new Set(['Mobility', 'Climate', 'Water', 'Care', 'Safety'])

app.use(cors())
app.use(express.json())

function clientIdFrom(req) {
  return String(req.header('x-client-id') || req.query.clientId || req.body?.clientId || 'demo-client')
}

function sendState(req, res, status = 200) {
  res.status(status).json(getState(clientIdFrom(req)))
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: 'sql.js/sqlite', database: 'data/nora.sqlite' })
})

app.get('/api/state', (req, res) => {
  sendState(req, res)
})

app.post('/api/activity', async (req, res, next) => {
  try {
    const { type, title, entityId } = req.body ?? {}

    if (!type?.trim() || !title?.trim()) {
      return res.status(400).json({ error: 'Activity type and title are required.' })
    }

    await recordActivity({
      type: type.trim(),
      title: title.trim(),
      entityId: entityId || null,
    })
    sendState(req, res, 201)
  } catch (error) {
    next(error)
  }
})

app.post('/api/demo/reset', async (req, res, next) => {
  try {
    await resetDemoState()
    sendState(req, res)
  } catch (error) {
    next(error)
  }
})

app.post('/api/signals', async (req, res, next) => {
  try {
    const { id, type, title, place, linkedDistrictId, status, votes, createdAt } = req.body ?? {}

    if (!allowedTypes.has(type)) {
      return res.status(400).json({ error: 'Signal type must be Mobility, Climate, Water, Care, or Safety.' })
    }
    if (!title?.trim() || !place?.trim() || !linkedDistrictId?.trim()) {
      return res.status(400).json({ error: 'Signal title, place, and linkedDistrictId are required.' })
    }
    if (status && !allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid signal status.' })
    }

    await createSignal({
      id,
      type,
      title: title.trim(),
      place: place.trim(),
      linkedDistrictId,
      status,
      votes,
      createdAt,
    })
    sendState(req, res, 201)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/signals/:id', async (req, res, next) => {
  try {
    const { status } = req.body ?? {}
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid signal status.' })
    }

    const signal = await updateSignalStatus(req.params.id, status)
    if (!signal) return res.status(404).json({ error: 'Signal not found.' })
    sendState(req, res)
  } catch (error) {
    next(error)
  }
})

app.post('/api/signals/:id/vote', async (req, res, next) => {
  try {
    const signal = await toggleVote(req.params.id, clientIdFrom(req))
    if (!signal) return res.status(404).json({ error: 'Signal not found.' })
    sendState(req, res)
  } catch (error) {
    next(error)
  }
})

app.post('/api/signals/:id/pilot', async (req, res, next) => {
  try {
    const { owner, eta, status, selectedInterventions } = req.body ?? {}
    if (status && !allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid pilot status.' })
    }
    if (selectedInterventions && !Array.isArray(selectedInterventions)) {
      return res.status(400).json({ error: 'selectedInterventions must be an array.' })
    }

    const pilot = await createPilot({
      signalId: req.params.id,
      owner,
      eta,
      status: status || 'pilot',
      selectedInterventions: selectedInterventions || [],
    })
    if (!pilot) return res.status(404).json({ error: 'Signal not found.' })
    sendState(req, res, 201)
  } catch (error) {
    next(error)
  }
})

if (fs.existsSync(distIndex)) {
  app.use(express.static(distDir))
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(distIndex)
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'NORA backend error.' })
})

await initDatabase()

app.listen(port, () => {
  console.log(`NORA API running on http://localhost:${port}`)
})
