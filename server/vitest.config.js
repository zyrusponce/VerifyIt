import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Starting the in-memory Postgres and applying migrations takes a few seconds.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
