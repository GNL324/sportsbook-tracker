export type Sportsbook = 'draftkings' | 'betmgm' | 'betrivers' | 'thescore'

export type TargetSummary = {
  id: string
  type: string
  title: string
  url: string
}

export type BrowserOpenRequest = {
  url: string
}

export type BrowserNavigateRequest = {
  targetId?: string
  url: string
}

export type BrowserClickRequest = {
  targetId?: string
  selector?: string
  x?: number
  y?: number
}

export type BrowserTypeRequest = {
  targetId?: string
  selector: string
  text: string
  clear?: boolean
}

export type PageState = {
  targetId: string
  url: string
  title: string
  visibleText: string
}

export type SportsbookNavigationRequest = {
  sportsbook: Sportsbook
  event?: string
  market?: string
  league?: string
  directUrl?: string
}

export type SportsbookNavigationPlan = {
  sportsbook: Sportsbook
  url: string
  manualSearchQuery: string
  notes?: string
}

export type LoginStatusRequest = {
  sportsbook: Sportsbook
  targetId?: string
}

export type LoginStatusResponse = {
  sportsbook: Sportsbook
  targetId: string
  loggedIn: boolean
  confidence: 'low' | 'medium' | 'high'
  indicators: string[]
}

export type OpportunityLegRequest = {
  sportsbook: Sportsbook
  event?: string
  market?: string
  league?: string
  directUrl?: string
}

export type OpportunityExecuteRequest = {
  event: string
  market: string
  league?: string
  legs: [OpportunityLegRequest, OpportunityLegRequest]
}

export type ApiErrorBody = {
  error: string
  details?: string
}

export type BrowserActionResponse = {
  ok: true
  targetId: string
  url: string
  title: string
}

export class BridgeHttpError extends Error {
  status: number
  details?: string

  constructor(status: number, message: string, details?: string) {
    super(message)
    this.name = 'BridgeHttpError'
    this.status = status
    this.details = details
  }
}
