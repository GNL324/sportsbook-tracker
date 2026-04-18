import type {
  CockpitReadiness,
  ConfidenceLevel,
  InteractiveLaneState,
  Opportunity,
  OpportunityLeg,
  Sportsbook,
} from '@/lib/sbb'

export type WindowLabel = 'A' | 'B' | 'unassigned'

export type BookSessionSnapshot = {
  sportsbook: Sportsbook
  attached: boolean
  readiness: CockpitReadiness
  blocker: string | null
  windowLabel: WindowLabel
  betslipHealthy: boolean
  eventConfidence: ConfidenceLevel
  marketConfidence: ConfidenceLevel
  lastVerifiedAt: string | null
}

export type LaneSessionSnapshot = BookSessionSnapshot & {
  laneId: 'A' | 'B'
  laneState: InteractiveLaneState
}

export type SbbSessionStateV1 = {
  version: 1
  intake: {
    event: string
    market: string
    legA: OpportunityLeg
    legB: OpportunityLeg
  }
  lanes: {
    A: LaneSessionSnapshot
    B: LaneSessionSnapshot
  }
}

const STORAGE_KEY = 'sbb-cockpit-session-v1'

function canUseLocalStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const probe = '__sbb_ls_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function loadSessionState(): SbbSessionStateV1 | null {
  if (!canUseLocalStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const v = parsed as Partial<SbbSessionStateV1>
    if (v.version !== 1 || !v.intake || !v.lanes?.A || !v.lanes?.B) return null
    return v as SbbSessionStateV1
  } catch {
    return null
  }
}

export function saveSessionState(state: SbbSessionStateV1): void {
  if (!canUseLocalStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

export function resetSessionState(): void {
  if (!canUseLocalStorage()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function buildDefaultSessionState(opportunity: Opportunity): SbbSessionStateV1 {
  const mkLane = (laneId: 'A' | 'B', leg: OpportunityLeg): LaneSessionSnapshot => {
    const conservative = leg.sportsbook === 'betrivers' || leg.sportsbook === 'thescore'
    return {
      laneId,
      sportsbook: leg.sportsbook,
      attached: !conservative,
      readiness: conservative ? 'needs_page_recovery' : 'ready',
      blocker: conservative
        ? 'Conservative book profile: confirm healthy betslip and verification timestamp before treating lane as ready.'
        : null,
      windowLabel: laneId,
      betslipHealthy: !conservative,
      eventConfidence: conservative ? 'medium' : 'high',
      marketConfidence: conservative ? 'medium' : 'high',
      lastVerifiedAt: conservative ? null : new Date().toISOString(),
      laneState: conservative ? 'recovering' : 'attached',
    }
  }

  return {
    version: 1,
    intake: {
      event: opportunity.event,
      market: opportunity.market,
      legA: { ...opportunity.legA },
      legB: { ...opportunity.legB },
    },
    lanes: {
      A: mkLane('A', opportunity.legA),
      B: mkLane('B', opportunity.legB),
    },
  }
}
