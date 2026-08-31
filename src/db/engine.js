import initSqlJs from 'sql.js/dist/sql-wasm.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { SQLITE_PATH } from './config.js'
import { execSchema } from './sql-utils.js'

let db = null
let saveTimer = null
let dirty = false

export function isDbReady() {
  return !!db
}

export function markDirty() {
  dirty = true
  schedulePersist()
}

function schedulePersist() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    persistToR2().catch((err) => console.warn('[sqlite] persist failed', err))
  }, 800)
}

export async function persistToR2() {
  if (!db || !dirty) return
  const blob = exportDatabase()
  const res = await fetch(SQLITE_PATH, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'application/x-sqlite3' },
  })
  const ct = res.headers.get('content-type') || ''
  if (!res.ok || ct.includes('sqlite') || ct.includes('octet-stream')) {
    console.warn('[sqlite] PUT not supported by Worker yet; changes kept in memory only')
    return
  }
  dirty = false
}

export function exportDatabase() {
  if (!db) return new Uint8Array()
  return db.export()
}

export function getDb() {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function queryAll(sql, params = []) {
  const stmt = getDb().prepare(sql)
  try {
    if (params.length) stmt.bind(params)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    return rows
  } finally {
    stmt.free()
  }
}

export function queryFirst(sql, params = []) {
  return queryAll(sql, params)[0] || null
}

export function run(sql, params = []) {
  getDb().run(sql, params)
  markDirty()
}

export async function initDatabase(seedSqlUrl = '/schema.sql') {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  let loaded = false

  try {
    const res = await fetch(SQLITE_PATH, { cache: 'no-store' })
    if (res.ok) {
      const buf = await res.arrayBuffer()
      if (buf.byteLength > 0) {
        db = new SQL.Database(new Uint8Array(buf))
        loaded = true
      }
    }
  } catch {
    // fall through to seed
  }

  if (!loaded) {
    db = new SQL.Database()
    const seedRes = await fetch(seedSqlUrl)
    const seed = await seedRes.text()
    execSchema(db, seed)
    dirty = true
    await persistToR2().catch(() => {})
  }

  return db
}
