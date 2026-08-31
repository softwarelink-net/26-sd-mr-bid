#!/usr/bin/env node
/** 从 schema.sql 生成 public/data/site.sqlite，部署时同步到 R2 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'
import { execSchema } from '../src/db/sql-utils.js'

const root = join(fileURLToPath(import.meta.url), '..', '..')
const schemaPath = join(root, 'schema.sql')
const outPath = join(root, 'public', 'data', 'site.sqlite')

async function main() {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  const schema = readFileSync(schemaPath, 'utf8')
  try {
    execSchema(db, schema)
  } catch (err) {
    console.error('Schema exec failed:', err.message)
    throw err
  }
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, Buffer.from(db.export()))
  console.log(`Built ${outPath} (${readFileSync(outPath).byteLength} bytes)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
