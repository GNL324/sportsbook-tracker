import type { SportsbookNavigationPlan, SportsbookNavigationRequest } from '../types.js'

const HOMEPAGE = 'https://www.betrivers.com/'

export function resolveBetRiversNavigation(
  request: SportsbookNavigationRequest,
): SportsbookNavigationPlan {
  const manualSearchQuery = [request.event, request.market].filter(Boolean).join(' ').trim()

  return {
    sportsbook: 'betrivers',
    url: request.directUrl || HOMEPAGE,
    manualSearchQuery,
    notes: request.directUrl
      ? 'Using caller-provided BetRivers URL.'
      : 'Manual event matching is still enabled; opening the homepage so the operator can search.',
  }
}
