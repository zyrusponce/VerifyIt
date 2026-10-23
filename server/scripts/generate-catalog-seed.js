// Writes a new supabase/migrations/<timestamp>_catalog_sync.sql when the catalog has changed.
// Usage: npm run catalog:seed [-- --timestamp=YYYYMMDDHHMMSS]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCatalogSyncSql } from '../src/data/catalogSql.js'

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations')

export function latestCatalogMigration(dir = migrationsDir) {
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('_catalog_sync.sql')).sort()
  return files.length ? path.join(dir, files.at(-1)) : null
}

function timestampNow() {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
}

function main() {
  const sql = buildCatalogSyncSql()
  const latest = latestCatalogMigration()
  if (latest && fs.readFileSync(latest, 'utf8').replaceAll('\r\n', '\n') === sql) {
    console.log(`Catalog unchanged. ${path.basename(latest)} is up to date.`)
    return
  }
  const timestampArg = process.argv.find((arg) => arg.startsWith('--timestamp='))?.split('=')[1]
  const timestamp = timestampArg ?? timestampNow()
  if (!/^\d{14}$/.test(timestamp)) throw new Error('--timestamp must be YYYYMMDDHHMMSS')
  const target = path.join(migrationsDir, `${timestamp}_catalog_sync.sql`)
  fs.writeFileSync(target, sql)
  console.log(`Wrote ${path.relative(process.cwd(), target)}. Apply it to your Supabase project (see README).`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
