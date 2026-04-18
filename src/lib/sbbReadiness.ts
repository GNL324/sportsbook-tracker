import type { CockpitReadiness, ConfidenceLevel, Sportsbook } from '@/lib/sbb'

export type BookReadinessInput = {
  sportsbook: Sportsbook
  attached: boolean
  betslipHealthy: boolean
  eventConfidence: ConfidenceLevel
  marketConfidence: ConfidenceLevel
  lastVerifiedAt: string | null
}

export type BookReadinessResult = {
  readiness: CockpitReadiness
  blocker: string | null
}

function isConservativeBook(sportsbook: Sportsbook): boolean {
  return sportsbook === 'betrivers' || sportsbook === 'thescore'
}

function confidenceOk(level: ConfidenceLevel): boolean {
  return level === 'medium' || level === 'high'
}

/**
 * Pure evaluation of a single book's cockpit readiness from observable flags.
 * DraftKings / BetMGM can reach `ready` when attached, healthy, and confidences are medium+.
 * BetRivers / theScore stay on `needs_page_recovery` until attached + healthy + verified timestamp.
 */
export function evaluateBookReadiness(book: BookReadinessInput): BookReadinessResult {
  if (!book.attached) {
    return {
      readiness: 'needs_auth',
      blocker: null,
    }
  }

  if (!book.betslipHealthy) {
    return {
      readiness: 'needs_page_recovery',
      blocker: 'Betslip is not healthy; recover the page before trusting execution.',
    }
  }

  if (isConservativeBook(book.sportsbook)) {
    const verified = Boolean(book.lastVerifiedAt?.trim())
    if (!verified) {
      return {
        readiness: 'needs_page_recovery',
        blocker: 'Conservative book: require explicit healthy slip plus a verification timestamp.',
      }
    }
    if (!confidenceOk(book.eventConfidence) || !confidenceOk(book.marketConfidence)) {
      return {
        readiness: 'verifying',
        blocker: 'Confidence is low; re-verify event and market before marking ready.',
      }
    }
    return { readiness: 'ready', blocker: null }
  }

  if (!confidenceOk(book.eventConfidence) || !confidenceOk(book.marketConfidence)) {
    return {
      readiness: 'verifying',
      blocker: 'Event or market confidence is low; continue verification.',
    }
  }

  return { readiness: 'ready', blocker: null }
}

export type PairReadinessStatus = 'green' | 'yellow' | 'red'

export type PairReadinessResult = {
  status: PairReadinessStatus
  summary: string
}

function hasBlockerText(blocker: string | null | undefined): boolean {
  return Boolean(blocker && blocker.trim().length > 0)
}

/**
 * Pair-level readiness using evaluated per-book signals plus operator blockers.
 * Any non-empty blocker on a lane floors the pair to at least yellow; paired with severe readiness can hit red.
 */
export function evaluatePairReadiness(
  bookA: BookReadinessInput & { blocker: string | null },
  bookB: BookReadinessInput & { blocker: string | null },
): PairReadinessResult {
  const evalA = evaluateBookReadiness(bookA)
  const evalB = evaluateBookReadiness(bookB)
  const manualA = hasBlockerText(bookA.blocker)
  const manualB = hasBlockerText(bookB.blocker)

  const severe = (r: CockpitReadiness) => r === 'needs_auth' || r === 'needs_page_recovery'

  if (severe(evalA.readiness) && severe(evalB.readiness)) {
    return {
      status: 'red',
      summary: 'Both lanes need recovery or authentication before the pair can proceed.',
    }
  }

  if (evalA.readiness === 'needs_auth' || evalB.readiness === 'needs_auth') {
    return {
      status: 'red',
      summary: 'At least one lane is not attached; authenticate and attach before pairing execution.',
    }
  }

  if (manualA || manualB) {
    const otherIssues =
      (severe(evalA.readiness) && !manualA) || (severe(evalB.readiness) && !manualB)
    return {
      status: otherIssues ? 'red' : 'yellow',
      summary: 'Operator blocker recorded on a lane; pair is held until the issue is cleared.',
    }
  }

  if (severe(evalA.readiness) || severe(evalB.readiness)) {
    return {
      status: 'yellow',
      summary: 'One lane still needs page recovery while the other may be further along.',
    }
  }

  if (evalA.readiness === 'verifying' || evalB.readiness === 'verifying') {
    return {
      status: 'yellow',
      summary: 'Verification or confidence checks still outstanding on at least one lane.',
    }
  }

  if (evalA.readiness === 'ready' && evalB.readiness === 'ready') {
    return {
      status: 'green',
      summary: 'Both evaluated books are attached, healthy, and meet confidence rules.',
    }
  }

  return {
    status: 'yellow',
    summary: 'Pair is progressing; finish verification or clear remaining readiness gaps.',
  }
}
