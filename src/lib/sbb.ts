export type Sportsbook = 'draftkings' | 'betmgm' | 'betrivers' | 'thescore'

export type LaneState =
  | 'idle'
  | 'reserved'
  | 'session_attached'
  | 'navigating'
  | 'verifying_event'
  | 'verifying_market'
  | 'selection_loaded'
  | 'stake_prepped'
  | 'ready_to_confirm'
  | 'recovering'
  | 'blocked'
  | 'released'

export type ReadinessState =
  | 'ready_for_execution'
  | 'ready_after_navigation'
  | 'needs_reauth'
  | 'needs_geo_fix'
  | 'needs_page_recovery'
  | 'blocked'
  | 'unknown'

export type PairReadiness = 'green' | 'yellow' | 'red'

export type OpportunityLeg = {
  sportsbook: Sportsbook
  side: string
  odds: string
  line?: string
}

export type Opportunity = {
  event: string
  market: string
  league?: string
  notes?: string
  legA: OpportunityLeg
  legB: OpportunityLeg
}

export type Lane = {
  id: 'A' | 'B'
  sportsbook: Sportsbook | null
  state: LaneState
  readiness: ReadinessState
  windowLabel: string
  eventConfidence: 'low' | 'medium' | 'high'
  marketConfidence: 'low' | 'medium' | 'high'
  betslipHealthy: boolean
  blocker?: string
}

export const sportsbookLabels: Record<Sportsbook, string> = {
  draftkings: 'DraftKings',
  betmgm: 'BetMGM',
  betrivers: 'BetRivers',
  thescore: 'theScore',
}

export const laneStateLabels: Record<LaneState, string> = {
  idle: 'Idle',
  reserved: 'Reserved',
  session_attached: 'Session Attached',
  navigating: 'Navigating',
  verifying_event: 'Verifying Event',
  verifying_market: 'Verifying Market',
  selection_loaded: 'Selection Loaded',
  stake_prepped: 'Stake Prepped',
  ready_to_confirm: 'Ready to Confirm',
  recovering: 'Recovering',
  blocked: 'Blocked',
  released: 'Released',
}

export const readinessLabels: Record<ReadinessState, string> = {
  ready_for_execution: 'Ready for Execution',
  ready_after_navigation: 'Ready After Navigation',
  needs_reauth: 'Needs Reauth',
  needs_geo_fix: 'Needs Geo Fix',
  needs_page_recovery: 'Needs Page Recovery',
  blocked: 'Blocked',
  unknown: 'Unknown',
}

export function mapOpportunityToLanes(opportunity: Opportunity): Lane[] {
  const first = createLane('A', opportunity.legA.sportsbook)
  const second = createLane('B', opportunity.legB.sportsbook)
  return [first, second]
}

function createLane(id: 'A' | 'B', sportsbook: Sportsbook): Lane {
  const conservative = sportsbook === 'betrivers' || sportsbook === 'thescore'

  return {
    id,
    sportsbook,
    state: conservative ? 'recovering' : 'session_attached',
    readiness: conservative ? 'needs_page_recovery' : 'ready_after_navigation',
    windowLabel: `Window ${id}`,
    eventConfidence: conservative ? 'medium' : 'high',
    marketConfidence: conservative ? 'medium' : 'high',
    betslipHealthy: !conservative,
    blocker: conservative ? 'Higher-friction book, prefer fresh-tab recovery before deeper execution.' : undefined,
  }
}

export function getPairReadiness(lanes: Lane[]): PairReadiness {
  if (lanes.some((lane) => lane.state === 'blocked' || lane.readiness === 'blocked' || lane.readiness === 'needs_reauth')) {
    return 'red'
  }

  if (lanes.every((lane) => lane.state === 'ready_to_confirm' || lane.state === 'stake_prepped')) {
    return 'green'
  }

  return 'yellow'
}

export function getPairSummary(lanes: Lane[]): string {
  const pair = getPairReadiness(lanes)
  if (pair === 'green') return 'Both lanes are at prep-ready or better.'
  if (pair === 'red') return 'At least one lane is blocked or needs stronger recovery.'
  return 'Pair is alive, but at least one lane still needs navigation, verification, or recovery.'
}

export const demoOpportunity: Opportunity = {
  event: 'Knicks vs Celtics',
  market: 'Moneyline',
  league: 'NBA',
  notes: 'Manual intake demo for first SBB slice.',
  legA: {
    sportsbook: 'draftkings',
    side: 'Knicks',
    odds: '+145',
  },
  legB: {
    sportsbook: 'betmgm',
    side: 'Celtics',
    odds: '-138',
  },
}
