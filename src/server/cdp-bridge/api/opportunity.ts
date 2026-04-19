import { Router } from 'express'
import { cdpBridgeClient } from '../client.js'
import { resolveSportsbookNavigation } from '../strategies/index.js'
import type { OpportunityExecuteRequest } from '../types.js'

export const opportunityRouter = Router()

opportunityRouter.post('/execute', async (req, res, next) => {
  try {
    const body = req.body as OpportunityExecuteRequest
    const plans = body.legs.map((leg) =>
      resolveSportsbookNavigation({
        sportsbook: leg.sportsbook,
        event: leg.event || body.event,
        market: leg.market || body.market,
        league: leg.league || body.league,
        directUrl: leg.directUrl,
      }),
    )

    const launches = await Promise.all(
      plans.map((plan) =>
        cdpBridgeClient.open({
          url: plan.url,
        }),
      ),
    )

    res.json({
      ok: true,
      event: body.event,
      market: body.market,
      plans,
      launches,
    })
  } catch (error) {
    next(error)
  }
})
