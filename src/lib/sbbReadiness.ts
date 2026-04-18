import type { Sportsbook } from './sbb';
import type { BookSessionState, BookReadiness } from './sbbSessionStore';

/** Conservative books that need explicit healthy flag */
const CONSERVATIVE_BOOKS: Sportsbook[] = ['betrivers', 'thescore'];

/** Books that can become ready when healthy */
const AGGRESSIVE_BOOKS: Sportsbook[] = ['draftkings', 'betmgm'];

export type ReadinessResult = {
  readiness: BookReadiness;
  blocker: string | null;
};

export type PairReadinessResult = {
  status: 'green' | 'yellow' | 'red';
  explanation: string;
  summary: string; // Legacy property for backward compatibility
  bothReady: boolean;
};

/**
 * Evaluate readiness for a single book
 * Rules:
 * - DraftKings + BetMGM: can become ready when healthy
 * - BetRivers + theScore: default conservative (recovering) unless explicitly healthy
 */
export function evaluateBookReadiness(state: BookSessionState): ReadinessResult {
  const { sportsbook, attached, healthy, recovering, lastVerifiedAt } = state;

  // Not attached
  if (!attached) {
    return {
      readiness: 'unattached',
      blocker: 'Browser not attached',
    };
  }

  // Check if in recovery mode
  if (recovering) {
    return {
      readiness: 'recovering',
      blocker: 'Book in recovery mode - manual intervention needed',
    };
  }

  // Conservative books need explicit healthy flag
  if (CONSERVATIVE_BOOKS.includes(sportsbook)) {
    if (!healthy) {
      return {
        readiness: 'recovering',
        blocker: `${sportsbook} requires explicit healthy flag - use recovery mode controls`,
      };
    }
  }

  // Attached but not verified
  if (!lastVerifiedAt) {
    return {
      readiness: 'attached_unverified',
      blocker: 'Session attached, awaiting verification',
    };
  }

  // Aggressive books can become ready when healthy
  if (AGGRESSIVE_BOOKS.includes(sportsbook)) {
    if (healthy) {
      return {
        readiness: 'ready',
        blocker: null,
      };
    }
    return {
      readiness: 'attached_unverified',
      blocker: 'Set healthy flag when session is verified ready',
    };
  }

  // Conservative books with healthy flag are ready
  if (healthy) {
    return {
      readiness: 'ready',
      blocker: null,
    };
  }

  return {
    readiness: 'attached_unverified',
    blocker: 'Awaiting verification',
  };
}

/**
 * Evaluate pair readiness between two books
 * Returns green/yellow/red status with explanation
 */
export function evaluatePairReadiness(
  bookA: BookSessionState,
  bookB: BookSessionState
): PairReadinessResult {
  const resultA = evaluateBookReadiness(bookA);
  const resultB = evaluateBookReadiness(bookB);

  const bothReady = resultA.readiness === 'ready' && resultB.readiness === 'ready';
  const neitherReady = resultA.readiness !== 'ready' && resultB.readiness !== 'ready';
  const oneReady = !neitherReady && !bothReady;

  if (bothReady) {
    const explanation = `${bookA.sportsbook} and ${bookB.sportsbook} both ready - human can place bets`;
    return {
      status: 'green',
      explanation,
      summary: explanation,
      bothReady: true,
    };
  }

  if (neitherReady) {
    const blockers = [`${bookA.sportsbook}: ${resultA.blocker || 'not ready'}`, `${bookB.sportsbook}: ${resultB.blocker || 'not ready'}`];
    const explanation = `Both books blocked - ${blockers.join('; ')}`;
    return {
      status: 'red',
      explanation,
      summary: explanation,
      bothReady: false,
    };
  }

  // One ready, one not
  const readyBook = resultA.readiness === 'ready' ? bookA : bookB;
  const waitingBook = resultA.readiness === 'ready' ? bookB : bookA;
  const waitingResult = resultA.readiness === 'ready' ? resultB : resultA;
  const explanation = `${readyBook.sportsbook} ready, waiting on ${waitingBook.sportsbook}: ${waitingResult.blocker}`;

  return {
    status: 'yellow',
    explanation,
    summary: explanation,
    bothReady: false,
  };
}
