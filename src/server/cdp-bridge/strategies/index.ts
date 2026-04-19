import { resolveBetMgmNavigation } from './betmgm.js'
import { resolveBetRiversNavigation } from './betrivers.js'
import { resolveDraftKingsNavigation } from './draftkings.js'
import { resolveTheScoreNavigation } from './thescore.js'
import type { Sportsbook, SportsbookNavigationPlan, SportsbookNavigationRequest } from '../types.js'

type StrategyResolver = (request: SportsbookNavigationRequest) => SportsbookNavigationPlan

const resolvers: Record<Sportsbook, StrategyResolver> = {
  draftkings: resolveDraftKingsNavigation,
  betmgm: resolveBetMgmNavigation,
  betrivers: resolveBetRiversNavigation,
  thescore: resolveTheScoreNavigation,
}

export function resolveSportsbookNavigation(
  request: SportsbookNavigationRequest,
): SportsbookNavigationPlan {
  return resolvers[request.sportsbook](request)
}
