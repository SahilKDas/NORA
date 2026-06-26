import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dataDir = path.join(projectRoot, 'data')
const dbPath = path.join(dataDir, 'nora.sqlite')

const nowMinus = minutes => new Date(Date.now() - minutes * 60 * 1000).toISOString()

const seedSignals = [
  {
    id: 'sig-bike-5th',
    type: 'Mobility',
    title: 'Bike lane obstruction',
    place: '5th & Alder',
    votes: 18,
    status: 'new',
    createdAt: nowMinus(8),
    linkedDistrictId: 'market',
  },
  {
    id: 'sig-shade-school',
    type: 'Climate',
    title: 'Bus stop needs shade',
    place: 'Northline School',
    votes: 42,
    status: 'triaged',
    createdAt: nowMinus(21),
    linkedDistrictId: 'north',
  },
  {
    id: 'sig-drain-river',
    type: 'Water',
    title: 'Drain clearing complete',
    place: 'River Ward 11',
    votes: 31,
    status: 'resolved',
    createdAt: nowMinus(36),
    linkedDistrictId: 'river',
  },
]

const seedPilots = [
  {
    id: 'pilot-river-drain',
    signalId: 'sig-drain-river',
    owner: 'River Ward resilience team',
    eta: 'Closed today',
    status: 'resolved',
    selectedInterventions: ['rain'],
    createdAt: nowMinus(34),
  },
]

const seedActivityEvents = [
  {
    type: 'seed',
    title: 'Demo database seeded with neighborhood signals',
    entityId: 'sig-bike-5th',
    createdAt: nowMinus(7),
  },
  {
    type: 'triage',
    title: 'Northline shade request moved to triage',
    entityId: 'sig-shade-school',
    createdAt: nowMinus(20),
  },
  {
    type: 'pilot',
    title: 'River Ward drain response closed as a public pilot',
    entityId: 'pilot-river-drain',
    createdAt: nowMinus(33),
  },
]

let db

function rows(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const output = []
  while (stmt.step()) output.push(stmt.getAsObject())
  stmt.free()
  return output
}

function row(sql, params = []) {
  return rows(sql, params)[0] ?? null
}

function scalar(sql, params = []) {
  const result = row(sql, params)
  return result ? Object.values(result)[0] : null
}

async function save() {
  await fsp.mkdir(dataDir, { recursive: true })
  await fsp.writeFile(dbPath, Buffer.from(db.export()))
}

function migrate() {
  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      place TEXT NOT NULL,
      votes INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      linked_district_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pilots (
      id TEXT PRIMARY KEY,
      signal_id TEXT NOT NULL UNIQUE,
      owner TEXT NOT NULL,
      eta TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pilot',
      selected_interventions TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS voted_signals (
      client_id TEXT NOT NULL,
      signal_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (client_id, signal_id),
      FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      entity_id TEXT,
      created_at TEXT NOT NULL
    );
  `)
}

function insertSignal(signal) {
  db.run(
    `INSERT INTO signals (id, type, title, place, votes, status, created_at, linked_district_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [signal.id, signal.type, signal.title, signal.place, signal.votes, signal.status, signal.createdAt, signal.linkedDistrictId],
  )
}

function insertPilot(pilot) {
  db.run(
    `INSERT INTO pilots (id, signal_id, owner, eta, status, selected_interventions, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [pilot.id, pilot.signalId, pilot.owner, pilot.eta, pilot.status, JSON.stringify(pilot.selectedInterventions), pilot.createdAt],
  )
}

function insertActivityEvent({ type, title, entityId = null, createdAt = new Date().toISOString() }) {
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  db.run(
    `INSERT INTO activity_events (id, type, title, entity_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, type, title, entityId, createdAt],
  )
}

function seedActivityIfNeeded() {
  const eventCount = Number(scalar('SELECT COUNT(*) AS count FROM activity_events') ?? 0)
  if (eventCount > 0) return

  seedActivityEvents.forEach(insertActivityEvent)
}

function seedBaseData() {
  seedSignals.forEach(insertSignal)
  seedPilots.forEach(insertPilot)
  seedActivityEvents.forEach(insertActivityEvent)
}

async function seedIfNeeded() {
  const signalCount = Number(scalar('SELECT COUNT(*) AS count FROM signals') ?? 0)
  if (signalCount > 0) {
    seedActivityIfNeeded()
    return
  }

  seedBaseData()
}

function normalizePilot(rowValue) {
  return {
    id: rowValue.id,
    signalId: rowValue.signalId,
    owner: rowValue.owner,
    eta: rowValue.eta,
    status: rowValue.status,
    selectedInterventions: JSON.parse(rowValue.selectedInterventions || '[]'),
    createdAt: rowValue.createdAt,
  }
}

export async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => path.join(projectRoot, 'node_modules', 'sql.js', 'dist', file),
  })

  db = fs.existsSync(dbPath)
    ? new SQL.Database(await fsp.readFile(dbPath))
    : new SQL.Database()

  migrate()
  await seedIfNeeded()
  await save()
}

export function getSignal(id) {
  return row(
    `SELECT id, type, title, place, votes, status, created_at AS createdAt, linked_district_id AS linkedDistrictId
     FROM signals
     WHERE id = ?`,
    [id],
  )
}

export function getState(clientId = 'demo-client') {
  const signals = rows(`
    SELECT id, type, title, place, votes, status, created_at AS createdAt, linked_district_id AS linkedDistrictId
    FROM signals
    ORDER BY datetime(created_at) DESC
  `)
  const pilots = rows(`
    SELECT id, signal_id AS signalId, owner, eta, status, selected_interventions AS selectedInterventions, created_at AS createdAt
    FROM pilots
    ORDER BY datetime(created_at) DESC
  `).map(normalizePilot)
  const votedSignals = Object.fromEntries(rows(
    'SELECT signal_id AS signalId FROM voted_signals WHERE client_id = ?',
    [clientId],
  ).map(item => [item.signalId, true]))
  const activityEvents = rows(`
    SELECT id, type, title, entity_id AS entityId, created_at AS createdAt
    FROM activity_events
    ORDER BY datetime(created_at) DESC
    LIMIT 12
  `)

  return { signals, pilots, votedSignals, activityEvents }
}

export async function recordActivity({ type, title, entityId = null }) {
  insertActivityEvent({ type, title, entityId })
  await save()
}

export async function createSignal(signal) {
  const nextSignal = {
    id: signal.id || `sig-${Date.now()}`,
    type: signal.type,
    title: signal.title,
    place: signal.place,
    votes: Number.isFinite(signal.votes) ? signal.votes : 1,
    status: signal.status || 'new',
    createdAt: signal.createdAt || new Date().toISOString(),
    linkedDistrictId: signal.linkedDistrictId,
  }
  const existingSignal = getSignal(nextSignal.id)

  db.run(
    `INSERT INTO signals (id, type, title, place, votes, status, created_at, linked_district_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       type = excluded.type,
       title = excluded.title,
       place = excluded.place,
       votes = MAX(signals.votes, excluded.votes),
       status = excluded.status,
       linked_district_id = excluded.linked_district_id`,
    [
      nextSignal.id,
      nextSignal.type,
      nextSignal.title,
      nextSignal.place,
      nextSignal.votes,
      nextSignal.status,
      nextSignal.createdAt,
      nextSignal.linkedDistrictId,
    ],
  )
  if (!existingSignal) {
    insertActivityEvent({
      type: 'signal',
      title: `Signal created: ${nextSignal.title}`,
      entityId: nextSignal.id,
    })
  }
  await save()
  return getSignal(nextSignal.id)
}

export async function updateSignalStatus(id, status) {
  const signal = getSignal(id)
  if (!signal) return null

  db.run('UPDATE signals SET status = ? WHERE id = ?', [status, id])
  insertActivityEvent({
    type: status,
    title: `Signal ${status}: ${signal.title}`,
    entityId: id,
  })
  await save()
  return getSignal(id)
}

export async function toggleVote(id, clientId = 'demo-client') {
  const signal = getSignal(id)
  if (!signal) return null

  const existingVote = row(
    'SELECT 1 AS voted FROM voted_signals WHERE client_id = ? AND signal_id = ?',
    [clientId, id],
  )

  if (existingVote) {
    db.run('DELETE FROM voted_signals WHERE client_id = ? AND signal_id = ?', [clientId, id])
    db.run('UPDATE signals SET votes = MAX(votes - 1, 0) WHERE id = ?', [id])
    insertActivityEvent({
      type: 'vote',
      title: `Vote removed: ${signal.title}`,
      entityId: id,
    })
  } else {
    db.run(
      'INSERT INTO voted_signals (client_id, signal_id, created_at) VALUES (?, ?, ?)',
      [clientId, id, new Date().toISOString()],
    )
    db.run('UPDATE signals SET votes = votes + 1 WHERE id = ?', [id])
    db.run("UPDATE signals SET status = 'triaged' WHERE id = ? AND votes >= 40 AND status = 'new'", [id])
    insertActivityEvent({
      type: 'vote',
      title: `Vote saved: ${signal.title}`,
      entityId: id,
    })
  }

  await save()
  return getSignal(id)
}

export async function createPilot({ signalId, owner, eta, status = 'pilot', selectedInterventions = [] }) {
  const signal = getSignal(signalId)
  if (!signal) return null

  const pilotId = `pilot-${signalId}`
  const existingPilot = row('SELECT id FROM pilots WHERE id = ?', [pilotId])
  db.run("UPDATE signals SET status = 'pilot' WHERE id = ?", [signalId])
  db.run(
    `INSERT INTO pilots (id, signal_id, owner, eta, status, selected_interventions, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       owner = excluded.owner,
       eta = excluded.eta,
       status = excluded.status,
       selected_interventions = excluded.selected_interventions`,
    [
      pilotId,
      signalId,
      owner || 'Neighborhood response team',
      eta || '14 days',
      status,
      JSON.stringify(selectedInterventions),
      new Date().toISOString(),
    ],
  )
  insertActivityEvent({
    type: 'pilot',
    title: `${existingPilot ? 'Pilot refreshed' : 'Pilot launched'}: ${signal.title}`,
    entityId: pilotId,
  })
  await save()
  return row(
    `SELECT id, signal_id AS signalId, owner, eta, status, selected_interventions AS selectedInterventions, created_at AS createdAt
     FROM pilots
     WHERE id = ?`,
    [pilotId],
  )
}

export async function resetDemoState() {
  db.run('DELETE FROM voted_signals')
  db.run('DELETE FROM pilots')
  db.run('DELETE FROM signals')
  db.run('DELETE FROM activity_events')
  seedBaseData()
  await save()
}
