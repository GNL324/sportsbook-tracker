import cors from 'cors'
import express from 'express'
import { browserRouter } from './api/browser.js'
import { opportunityRouter } from './api/opportunity.js'
import { sportsbookRouter } from './api/sportsbook.js'
import { cdpBridgeClient } from './client.js'
import { BridgeHttpError } from './types.js'
import type { ApiErrorBody } from './types.js'

const PORT = Number(process.env.CDP_BRIDGE_PORT || 3001)
const allowedOrigins = new Set([
  'https://gnl324.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3003',
  'http://127.0.0.1:3003',
])

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`))
    },
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', async (_req, res, next) => {
  try {
    const version = await cdpBridgeClient.getVersion()
    res.json({
      ok: true,
      port: PORT,
      chrome: version.Browser,
      websocketDebuggerUrl: version.webSocketDebuggerUrl,
    })
  } catch (error) {
    next(error)
  }
})

app.use('/api/browser', browserRouter)
app.use('/api/sportsbook', sportsbookRouter)
app.use('/api/opportunity', opportunityRouter)

app.use((error: unknown, _req: express.Request, res: express.Response<ApiErrorBody>, _next: express.NextFunction) => {
  const status = error instanceof BridgeHttpError ? error.status : 500
  const message = error instanceof Error ? error.message : 'Unknown bridge error.'
  const details = error instanceof BridgeHttpError ? error.details : undefined

  res.status(status).json({
    error: message,
    details,
  })
})

const server = app.listen(PORT, () => {
  console.log(`CDP bridge listening on http://localhost:${PORT}`)
})

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down CDP bridge.`)
  server.close(async () => {
    await cdpBridgeClient.close()
    process.exit(0)
  })
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
