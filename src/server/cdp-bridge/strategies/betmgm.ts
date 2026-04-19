import type { SportsbookNavigationPlan, SportsbookNavigationRequest } from '../types.js'

const HOMEPAGE = 'https://sports.betmgm.com/'

export function resolveBetMgmNavigation(
  request: SportsbookNavigationRequest,
): SportsbookNavigationPlan {
  const manualSearchQuery = [request.event, request.market].filter(Boolean).join(' ').trim()

  return {
    sportsbook: 'betmgm',
    url: request.directUrl || HOMEPAGE,
    manualSearchQuery,
    notes: request.directUrl
      ? 'Using caller-provided BetMGM URL.'
      : 'Manual event matching is still enabled; opening the homepage so the operator can search.',
  }
}
