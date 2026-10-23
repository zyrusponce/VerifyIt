
import { httpServerHandler } from 'cloudflare:node'
import { createApp } from './src/app.js'
import { loadConfig } from './src/config/env.js'
import { createSupabaseGateway } from './src/config/supabase.js'
import { createLogger } from './src/utils/logger.js'

// Initialize the same dependencies as the local Express server.
const config = loadConfig(process.env)
const logger = createLogger({ level: config.logLevel })
const { auth, repositories } = createSupabaseGateway(config)

// Create the Express application with its required dependencies.
const app = createApp({
  config,
  auth,
  repositories,
  logger,
})

// Expose Express through the Cloudflare Workers HTTP adapter.
app.listen(3000)

export default httpServerHandler({ port: 3000 })
