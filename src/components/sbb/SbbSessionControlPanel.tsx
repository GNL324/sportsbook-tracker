'use client';

import React from 'react';
import type { Sportsbook } from '../../lib/sbb';
import { useSbbSessionState } from '../../hooks/useSbbSessionState';

const BOOK_DISPLAY_NAMES: Record<Sportsbook, string> = {
  draftkings: 'DraftKings',
  betmgm: 'BetMGM',
  betrivers: 'BetRivers',
  thescore: 'theScore',
};

const READINESS_COLORS: Record<string, string> = {
  ready: 'bg-green-500',
  attached_unverified: 'bg-yellow-500',
  verifying: 'bg-yellow-500',
  recovering: 'bg-orange-500',
  unattached: 'bg-gray-400',
  blocked: 'bg-red-500',
};

const PAIR_STATUS_COLORS = {
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
};

export function SbbSessionControlPanel(): React.ReactElement {
  const {
    sessionState,
    updateBookState,
    assignWindow,
    recomputeReadiness,
    resetAll,
    getPairReadiness,
  } = useSbbSessionState();

  const books = Object.keys(sessionState.books) as Sportsbook[];
  const conservativeBooks: Sportsbook[] = ['betrivers', 'thescore'];
  // Get pairs for display
  const pair1 = getPairReadiness('draftkings', 'betmgm');
  const pair2 = getPairReadiness('betrivers', 'thescore');
  const pair3 = getPairReadiness('draftkings', 'betrivers');
  const pair4 = getPairReadiness('betmgm', 'thescore');

  const pairs = [
    { name: 'DraftKings ↔ BetMGM', ...pair1 },
    { name: 'BetRivers ↔ theScore', ...pair2 },
    { name: 'DraftKings ↔ BetRivers', ...pair3 },
    { name: 'BetMGM ↔ theScore', ...pair4 },
  ];

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Shared Sportsbook Browser (SBB)
          </h2>
          <p className="text-sm text-gray-600">
            Session Attachment Control Panel
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={recomputeReadiness}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Recompute
          </button>
          <button
            onClick={resetAll}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Per-Book Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {books.map((book) => {
          const state = sessionState.books[book];
          const isConservative = conservativeBooks.includes(book);

          return (
            <div
              key={book}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              {/* Book Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      READINESS_COLORS[state.readiness] || 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium text-gray-900">
                    {BOOK_DISPLAY_NAMES[book]}
                  </span>
                  {isConservative && (
                    <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                      Conservative
                    </span>
                  )}
                </div>

                <select
                  value={state.windowLabel}
                  onChange={(e) => assignWindow(book, e.target.value as 'A' | 'B' | 'unassigned')}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="unassigned">No Window</option>
                  <option value="A">Window A</option>
                  <option value="B">Window B</option>
                </select>
              </div>

              {/* Readiness Badge */}
              <div className="text-sm">
                <span className="text-gray-500">Status: </span>
                <span
                  className={`font-medium ${
                    state.readiness === 'ready'
                      ? 'text-green-600'
                      : state.readiness === 'recovering'
                      ? 'text-orange-600'
                      : state.readiness === 'blocked'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {state.readiness.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Blocker */}
              {state.blocker && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  <span className="font-medium">Blocker: </span>
                  {state.blocker}
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.attached}
                    onChange={(e) => updateBookState(book, { attached: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Browser Attached</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.healthy || false}
                    onChange={(e) => updateBookState(book, { healthy: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Healthy / Verified</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.recovering || false}
                    onChange={(e) => updateBookState(book, {
                      recovering: e.target.checked,
                      healthy: e.target.checked ? false : state.healthy,
                    })}
                    className="w-4 h-4"
                  />
                  <span>Recovery Mode</span>
                </label>
              </div>

              {/* Notes */}
              <input
                type="text"
                value={state.notes}
                onChange={(e) => updateBookState(book, { notes: e.target.value })}
                placeholder="Notes..."
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              />
            </div>
          );
        })}
      </div>

      {/* Pair Readiness Summary */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Pair Readiness</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pairs.map((pair) => (
            <div
              key={pair.name}
              className={`text-sm ${PAIR_STATUS_COLORS[pair.status]}`}
            >
              <div className="font-medium">{pair.name}</div>
              <div className="text-xs text-gray-600">{pair.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
