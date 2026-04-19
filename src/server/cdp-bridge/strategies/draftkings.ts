import type { SportsbookNavigationPlan, SportsbookNavigationRequest } from '../types.js'

const HOMEPAGE = 'https://sportsbook.draftkings.com/'

export function resolveDraftKingsNavigation(
  request: SportsbookNavigationRequest,
): SportsbookNavigationPlan {
  const manualSearchQuery = [request.event, request.market].filter(Boolean).join(' ').trim()

  return {
    sportsbook: 'draftkings',
    url: request.directUrl || HOMEPAGE,
    manualSearchQuery,
    notes: request.directUrl
      ? 'Using caller-provided DraftKings URL.'
      : 'Manual event matching is still enabled; opening the homepage so the operator can search.',
  }
}
