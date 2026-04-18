import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Sportsbook } from '../lib/sbb';
import type { SbbSessionState, BookSessionState } from '../lib/sbbSessionStore';
import {
  loadSessionState,
  saveSessionState,
  createDefaultSessionState,
  resetSessionState,
} from '../lib/sbbSessionStore';
import { evaluateBookReadiness, evaluatePairReadiness } from '../lib/sbbReadiness';

/** Partial update for a book's state */
type BookStatePatch = Partial<Omit<BookSessionState, 'sportsbook'>>;

/** Hook return type */
export type UseSbbSessionStateReturn = {
  sessionState: SbbSessionState;
  /** Update specific fields for a book */
  updateBookState: (book: Sportsbook, patch: BookStatePatch) => void;
  /** Assign a window label to a book (A, B, or unassigned) */
  assignWindow: (book: Sportsbook, lane: 'A' | 'B' | 'unassigned') => void;
  /** Re-evaluate readiness for all books based on current state */
  recomputeReadiness: () => void;
  /** Reset all state to defaults */
  resetAll: () => void;
  /** Get computed readiness for a book */
  getBookReadiness: (book: Sportsbook) => ReturnType<typeof evaluateBookReadiness>;
  /** Get pair readiness between two books */
  getPairReadiness: (bookA: Sportsbook, bookB: Sportsbook) => ReturnType<typeof evaluatePairReadiness>;
  /** Is state loaded from localStorage */
  isLoaded: boolean;
};

/**
 * React hook for SBB session state management
 * Provides state, updates, and persistence via localStorage
 */
export function useSbbSessionState(): UseSbbSessionStateReturn {
  const [sessionState, setSessionState] = useState<SbbSessionState>(createDefaultSessionState());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadSessionState();
    if (loaded) {
      setSessionState(loaded);
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (isLoaded) {
      saveSessionState(sessionState);
    }
  }, [sessionState, isLoaded]);

  /**
   * Update specific fields for a book
   */
  const updateBookState = useCallback((book: Sportsbook, patch: BookStatePatch) => {
    setSessionState(prev => {
      const currentBook = prev.books[book] ?? createDefaultSessionState().books[book];
      const updatedBook: BookSessionState = { ...currentBook, ...patch };
      
      // Auto-update readiness based on new state
      const { readiness, blocker } = evaluateBookReadiness(updatedBook);
      updatedBook.readiness = readiness;
      updatedBook.blocker = blocker;

      return {
        ...prev,
        books: {
          ...prev.books,
          [book]: updatedBook,
        },
      };
    });
  }, []);

  /**
   * Assign a window label to a book
   */
  const assignWindow = useCallback((book: Sportsbook, lane: 'A' | 'B' | 'unassigned') => {
    updateBookState(book, { windowLabel: lane });
  }, [updateBookState]);

  /**
   * Re-evaluate readiness for all books
   */
  const recomputeReadiness = useCallback(() => {
    setSessionState(prev => {
      const defaults = createDefaultSessionState().books;
      const updatedBooks: Record<Sportsbook, BookSessionState> = { ...defaults, ...prev.books };
      
      (Object.keys(updatedBooks) as Sportsbook[]).forEach(book => {
        const { readiness, blocker } = evaluateBookReadiness(updatedBooks[book]);
        updatedBooks[book] = {
          ...updatedBooks[book],
          readiness,
          blocker,
        };
      });

      return {
        ...prev,
        books: updatedBooks,
      };
    });
  }, []);

  /**
   * Reset all state to defaults
   */
  const resetAll = useCallback(() => {
    const fresh = resetSessionState();
    setSessionState(fresh);
  }, []);

  /**
   * Get computed readiness for a specific book
   */
  const getBookReadiness = useCallback(
    (book: Sportsbook) => evaluateBookReadiness(sessionState.books[book]),
    [sessionState]
  );

  /**
   * Get pair readiness between two books
   */
  const getPairReadiness = useCallback(
    (bookA: Sportsbook, bookB: Sportsbook) =>
      evaluatePairReadiness(sessionState.books[bookA], sessionState.books[bookB]),
    [sessionState]
  );

  return {
    sessionState,
    updateBookState,
    assignWindow,
    recomputeReadiness,
    resetAll,
    getBookReadiness,
    getPairReadiness,
    isLoaded,
  };
}
