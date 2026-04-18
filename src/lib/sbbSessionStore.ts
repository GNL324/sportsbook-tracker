import type { Sportsbook } from './sbb';

/** Per-book session state for SBB browser attachment (new interface) */
export interface BookSessionState {
  sportsbook: Sportsbook;
  attached: boolean;
  lastVerifiedAt: string | null;
  readiness: BookReadiness;
  blocker: string | null;
  windowLabel: 'A' | 'B' | 'unassigned';
  notes: string;
  healthy?: boolean;
  recovering?: boolean;
}

/** Legacy interface for backward compatibility */
export interface LaneSessionSnapshot {
  sportsbook: Sportsbook;
  attached: boolean;
  betslipHealthy: boolean;
  eventConfidence: 'low' | 'medium' | 'high';
  marketConfidence: 'low' | 'medium' | 'high';
  blocker: string | null;
  lastVerifiedAt: string | null;
  windowLabel: 'A' | 'B' | 'unassigned';
  laneState?: string;
  readiness?: string;
}

export type BookReadiness = 
  | 'unattached'
  | 'attached_unverified'
  | 'verifying'
  | 'ready'
  | 'recovering'
  | 'blocked';

/** Full session state for all books */
export interface SbbSessionState {
  books: Record<Sportsbook, BookSessionState>;
  lastUpdated: string | null;
}

/** Legacy V1 state interface for backward compatibility */
export interface SbbSessionStateV1 {
  lanes: {
    A: LaneSessionSnapshot;
    B: LaneSessionSnapshot;
  };
  intake: {
    event: string;
    market: string;
    legA: { side: string; odds: string; sportsbook: Sportsbook };
    legB: { side: string; odds: string; sportsbook: Sportsbook };
  };
  lastUpdated?: string | null;
}

/** Default state for a single book */
export function createDefaultBookState(sportsbook: Sportsbook): BookSessionState {
  return {
    sportsbook,
    attached: false,
    lastVerifiedAt: null,
    readiness: 'unattached',
    blocker: null,
    windowLabel: 'unassigned',
    notes: '',
    healthy: false,
    recovering: false,
  };
}

/** Legacy: build default session state (backward compatible) */
export function buildDefaultSessionState(opportunity?: {
  legA: { sportsbook: Sportsbook };
  legB: { sportsbook: Sportsbook };
}): SbbSessionStateV1 {
  const bookA = opportunity?.legA.sportsbook ?? 'draftkings';
  const bookB = opportunity?.legB.sportsbook ?? 'betmgm';

  return {
    lanes: {
      A: {
        sportsbook: bookA,
        attached: false,
        betslipHealthy: false,
        eventConfidence: 'low',
        marketConfidence: 'low',
        blocker: null,
        lastVerifiedAt: null,
        windowLabel: 'A',
        laneState: 'reserved',
        readiness: 'unknown',
      },
      B: {
        sportsbook: bookB,
        attached: false,
        betslipHealthy: false,
        eventConfidence: 'low',
        marketConfidence: 'low',
        blocker: null,
        lastVerifiedAt: null,
        windowLabel: 'B',
        laneState: 'reserved',
        readiness: 'unknown',
      },
    },
    intake: {
      event: '',
      market: '',
      legA: { side: '', odds: '', sportsbook: bookA },
      legB: { side: '', odds: '', sportsbook: bookB },
    },
    lastUpdated: null,
  };
}

/** Default state for all books */
export function createDefaultSessionState(): SbbSessionState {
  const books: Record<Sportsbook, BookSessionState> = {
    draftkings: createDefaultBookState('draftkings'),
    betmgm: createDefaultBookState('betmgm'),
    betrivers: createDefaultBookState('betrivers'),
    thescore: createDefaultBookState('thescore'),
  };

  return {
    books,
    lastUpdated: null,
  };
}

const STORAGE_KEY = 'sbb-session-state-v1';
const LEGACY_STORAGE_KEY = 'sbb-cockpit-v1';

/** Load session state from localStorage (safe for SSR) */
export function loadSessionState(): SbbSessionState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as SbbSessionState;
    
    // Validate structure
    if (!parsed.books || typeof parsed.books !== 'object') {
      console.warn('Invalid session state structure, resetting');
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load session state:', err);
    return null;
  }
}

/** Legacy load for backward compatibility */
export function loadCockpitState(): SbbSessionStateV1 | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as SbbSessionStateV1;
  } catch (err) {
    console.error('Failed to load cockpit state:', err);
    return null;
  }
}

/** Save session state to localStorage (safe for SSR) */
export function saveSessionState(state: SbbSessionState | SbbSessionStateV1): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stateWithTimestamp = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    // Also save to legacy key for compatibility
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
  } catch (err) {
    console.error('Failed to save session state:', err);
  }
}

/** Legacy: clear persisted session */
export function clearPersistedSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

/** Reset session state to defaults */
export function resetSessionState(): SbbSessionState {
  const fresh = createDefaultSessionState();
  saveSessionState(fresh);
  return fresh;
}
