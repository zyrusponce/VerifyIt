// Starts the full local stack for browser tests: the real Express API on the real migrations (PGlite),
// a stand-in Supabase Auth server, and the real Vite frontend wired to both.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from '../../src/app.js'
import { loadConfig } from '../../src/config/env.js'
import { createLogger } from '../../src/utils/logger.js'
import { createTestDatabase } from '../db/harness.js'
import { createPgliteRepositories } from '../support/pgliteRepository.js'
import { createFakeSupabaseAuth } from './fakeSupabaseAuth.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

function listen(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server))
    server.on('error', reject)
  })
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message}`)
}

export async function startStack({ apiPort = 4317, authPort = 5480, webPort = 5199 } = {}) {
  const db = await createTestDatabase()
  const fakeAuth = createFakeSupabaseAuth({ db })
  const authServer = await listen(fakeAuth.app, authPort)

  const webOrigin = `http://localhost:${webPort}`
  const config = loadConfig({
    NODE_ENV: 'test',
    FRONTEND_URL: webOrigin,
    PUBLIC_APP_URL: webOrigin,
    SUPABASE_URL: `http://localhost:${authPort}`,
    SUPABASE_ANON_KEY: 'e2e-anon-key-not-a-secret',
    CERTIFICATE_TIMEZONE: 'Asia/Manila',
  })
  const api = createApp({
    config,
    auth: fakeAuth.verifier,
    repositories: createPgliteRepositories(db),
    logger: createLogger({ level: process.env.E2E_API_LOG_LEVEL ?? 'silent' }),
    options: { rateLimit: { enabled: false } },
  })
  const apiServer = await listen(api, apiPort)

  const viteOutput = []
  const vite = spawn(process.execPath, [path.join(repoRoot, 'node_modules/vite/bin/vite.js'), '--port', String(webPort), '--strictPort'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: `http://localhost:${authPort}`,
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key-not-a-secret',
      VITE_API_URL: '/api/v1',
      VERIFYIT_API_PROXY: `http://localhost:${apiPort}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  vite.stdout.on('data', (chunk) => viteOutput.push(String(chunk)))
  vite.stderr.on('data', (chunk) => viteOutput.push(String(chunk)))

  try {
    await waitForHttp(webOrigin, 60_000)
  } catch (error) {
    vite.kill()
    throw new Error(`${error.message}\nVite output:\n${viteOutput.join('')}`)
  }

  return {
    db,
    baseUrl: webOrigin,
    async stop() {
      vite.kill()
      await new Promise((resolve) => apiServer.close(resolve))
      await new Promise((resolve) => authServer.close(resolve))
    },
  }
}
