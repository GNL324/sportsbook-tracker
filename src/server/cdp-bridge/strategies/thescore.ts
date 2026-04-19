import type { SportsbookNavigationPlan, SportsbookNavigationRequest } from '../types.js'

const HOMEPAGE = 'https://thescore.bet/'

export function resolveTheScoreNavigation(
  request: SportsbookNavigationRequest,
): SportsbookNavigationPlan {
  const manualSearchQuery = [request.event, request.market].filter(Boolean).join(' ').trim()

  return {
    sportsbook: 'thescore',
    url: request.directUrl || HOMEPAGE,
    manualSearchQuery,
    notes: request.directUrl
      ? 'Using caller-provided theScore URL.'
      : 'Manual event matching is still enabled; opening the homepage so the operator can search.',
  }
}
