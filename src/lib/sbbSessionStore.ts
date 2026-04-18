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

function isBookSessionState(value: unknown): value is BookSessionState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'sportsbook' in value &&
      'attached' in value &&
      'windowLabel' in value
  );
}

function isLaneSnapshot(value: unknown): value is LaneSessionSnapshot {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'sportsbook' in value &&
      'attached' in value &&
      'betslipHealthy' in value &&
      'windowLabel' in value
  );
}

function isSessionState(value: unknown): value is SbbSessionState {
  return Boolean(value && typeof value === 'object' && 'books' in value);
}

function isCockpitState(value: unknown): value is SbbSessionStateV1 {
  return Boolean(value && typeof value === 'object' && 'lanes' in value && 'intake' in value);
}

function normalizeSessionState(parsed: unknown): SbbSessionState | null {
  if (!isSessionState(parsed) || !parsed.books || typeof parsed.books !== 'object') {
    return null;
  }

  const fresh = createDefaultSessionState();
  const mergedBooks = { ...fresh.books };

  (Object.keys(fresh.books) as Sportsbook[]).forEach((book) => {
    const candidate = parsed.books[book];
    if (isBookSessionState(candidate)) {
      mergedBooks[book] = { ...fresh.books[book], ...candidate, sportsbook: book };
    }
  });

  return {
    books: mergedBooks,
    lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : null,
  };
}

function normalizeCockpitState(parsed: unknown): SbbSessionStateV1 | null {
  if (!isCockpitState(parsed) || !parsed.lanes || !parsed.intake) {
    return null;
  }

  const fresh = buildDefaultSessionState();
  const laneA = isLaneSnapshot(parsed.lanes.A) ? parsed.lanes.A : null;
  const laneB = isLaneSnapshot(parsed.lanes.B) ? parsed.lanes.B : null;

  return {
    lanes: {
      A: { ...fresh.lanes.A, ...(laneA ?? {}) },
      B: { ...fresh.lanes.B, ...(laneB ?? {}) },
    },
    intake: {
      event: typeof parsed.intake.event === 'string' ? parsed.intake.event : fresh.intake.event,
      market: typeof parsed.intake.market === 'string' ? parsed.intake.market : fresh.intake.market,
      legA: {
        ...fresh.intake.legA,
        ...(parsed.intake.legA && typeof parsed.intake.legA === 'object' ? parsed.intake.legA : {}),
      },
      legB: {
        ...fresh.intake.legB,
        ...(parsed.intake.legB && typeof parsed.intake.legB === 'object' ? parsed.intake.legB : {}),
      },
    },
    lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : null,
  };
}

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

    const parsed = JSON.parse(stored) as unknown;
    const normalized = normalizeSessionState(parsed);

    if (!normalized) {
      console.warn('Invalid session state structure, resetting');
      return null;
    }

    return normalized;
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
    const parsed = JSON.parse(stored) as unknown;
    const normalized = normalizeCockpitState(parsed);

    if (!normalized) {
      console.warn('Invalid cockpit state structure, resetting');
      return null;
    }

    return normalized;
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
    if ('books' in state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    }

    if ('lanes' in state) {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    }
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
