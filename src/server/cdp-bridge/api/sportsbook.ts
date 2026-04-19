import { Router } from 'express'
import { cdpBridgeClient } from '../client.js'
import type { LoginStatusRequest, LoginStatusResponse } from '../types.js'

const loginIndicators = [
  'log out',
  'logout',
  'my account',
  'account',
  'wallet',
  'cashier',
  'betslip',
  'responsible gaming',
]

export const sportsbookRouter = Router()

sportsbookRouter.post('/login-status', async (req, res, next) => {
  try {
    const body = req.body as LoginStatusRequest
    const pageState = await cdpBridgeClient.getPageState(body.targetId)
    const normalizedText = pageState.visibleText.toLowerCase()
    const indicators = loginIndicators.filter((indicator) => normalizedText.includes(indicator))
    const response: LoginStatusResponse = {
      sportsbook: body.sportsbook,
      targetId: pageState.targetId,
      loggedIn: indicators.length >= 2,
      confidence: indicators.length >= 3 ? 'high' : indicators.length >= 2 ? 'medium' : 'low',
      indicators,
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
})
