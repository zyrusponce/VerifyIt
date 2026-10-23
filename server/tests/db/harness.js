// Runs the real Supabase migrations in an in-memory Postgres (PGlite) and lets tests act as
// a specific user (role `authenticated` + JWT `sub` claim) or as `anon`, exactly as PostgREST does.
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const here = path.dirname(fileURLToPath(import.meta.url))
export const MIGRATIONS_DIR = path.resolve(here, '../../../supabase/migrations')

export async function createTestDatabase() {
  const db = await PGlite.create({ extensions: { pgcrypto } })
  await db.exec(fs.readFileSync(path.join(here, 'supabaseShim.sql'), 'utf8'))
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    await db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
  }
  return db
}

/** Inserts an auth user the way Supabase Auth would (this fires the profile trigger). */
export async function createUser(db, { displayName } = {}) {
  const id = randomUUID()
  const metadata = displayName === undefined ? {} : { display_name: displayName }
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [
    id,
    `${id}@example.test`,
    metadata,
  ])
  return id
}

async function withRole(db, role, userId, fn) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claims', $1, true)", [userId ? JSON.stringify({ sub: userId, role }) : ''])
    return fn(tx)
  })
}

/** Runs `fn(tx)` as the given signed-in user. */
export function asUser(db, userId, fn) {
  return withRole(db, 'authenticated', userId, fn)
}

/** Runs `fn(tx)` as an anonymous API caller. */
export function asAnon(db, fn) {
  return withRole(db, 'anon', null, fn)
}

/** Calls an RPC as a user and returns its jsonb result. */
export async function rpc(db, userId, sql, params = []) {
  return asUser(db, userId, async (tx) => (await tx.query(sql, params)).rows[0])
}
