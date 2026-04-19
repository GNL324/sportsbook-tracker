import { Router } from 'express'
import { cdpBridgeClient } from '../client.js'
import type {
  BrowserClickRequest,
  BrowserNavigateRequest,
  BrowserOpenRequest,
  BrowserTypeRequest,
} from '../types.js'

export const browserRouter = Router()

browserRouter.post('/open', async (req, res, next) => {
  try {
    const body = req.body as BrowserOpenRequest
    const result = await cdpBridgeClient.open(body)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

browserRouter.post('/navigate', async (req, res, next) => {
  try {
    const body = req.body as BrowserNavigateRequest
    const result = await cdpBridgeClient.navigate(body)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

browserRouter.get('/screenshot', async (req, res, next) => {
  try {
    const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined
    const image = await cdpBridgeClient.screenshot(targetId)
    res.setHeader('Content-Type', 'image/png')
    res.send(image)
  } catch (error) {
    next(error)
  }
})

browserRouter.get('/page-state', async (req, res, next) => {
  try {
    const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined
    const result = await cdpBridgeClient.getPageState(targetId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

browserRouter.post('/click', async (req, res, next) => {
  try {
    const body = req.body as BrowserClickRequest
    const result = await cdpBridgeClient.click(body)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

browserRouter.post('/type', async (req, res, next) => {
  try {
    const body = req.body as BrowserTypeRequest
    const result = await cdpBridgeClient.type(body)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

browserRouter.get('/targets', async (_req, res, next) => {
  try {
    const version = await cdpBridgeClient.getVersion()
    const targets = await cdpBridgeClient.listTargets()
    res.json({
      browser: version.Browser,
      websocketDebuggerUrl: version.webSocketDebuggerUrl,
      targets,
    })
  } catch (error) {
    next(error)
  }
})
