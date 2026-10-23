// Entry point: validates configuration, wires Supabase, starts HTTP, and shuts down gracefully.
import 'dotenv/config'
import { createApp } from './app.js'
import { ConfigError, loadConfig } from './config/env.js'
import { createSupabaseGateway } from './config/supabase.js'
import { createLogger } from './utils/logger.js'

function start() {
  let config
  try {
    config = loadConfig(process.env)
  } catch (error) {
    // The logger is not configured yet; report the problem on stderr and stop.
    const report = error instanceof ConfigError ? error.message : `Failed to load configuration: ${error?.stack ?? error}`
    process.stderr.write(`${report}\nCopy server/.env.example to server/.env and fill in the values.\n`)
    process.exit(1)
  }

  const logger = createLogger({ level: config.logLevel })
  const { auth, repositories } = createSupabaseGateway(config)
  const app = createApp({ config, auth, repositories, logger })

  // Express 5 calls this callback with an error when the port cannot be opened, so check it first.
  const server = app.listen(config.port, (error) => {
    if (error) {
      const hint =
        error.code === 'EADDRINUSE'
          ? `Port ${config.port} is already in use. Another copy of the API is probably running: stop it, or set PORT in server/.env.`
          : 'The HTTP server could not start.'
      logger.error('HTTP server failed to start', { port: config.port, hint, error })
      process.exit(1)
    }
    logger.info('VerifyIT API listening', { port: config.port, env: config.env, allowedOrigins: config.corsOrigins })
  })

  const shutdown = (signal) => {
    logger.info('shutting down', { signal })
    server.close((error) => {
      if (error) logger.error('error while closing HTTP server', { error })
      process.exit(error ? 1 : 0)
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => logger.error('unhandled promise rejection', { error: reason }))
}

start()
