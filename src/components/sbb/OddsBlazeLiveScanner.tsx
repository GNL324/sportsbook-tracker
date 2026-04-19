'use client'

import { useState } from 'react'
import type { Sportsbook } from '@/lib/sbb'

export interface ArbitrageOpportunity {
  edge: number
  market: string
  event: string
  legA: {
    sportsbook: Sportsbook
    bookCode: string
    player: string
    side: string
    line: string
    odds: string
  }
  legB: {
    sportsbook: Sportsbook
    bookCode: string
    player: string
    side: string
    line: string
    odds: string
  }
}

export function OddsBlazeLiveScanner({
  onSelect,
  onRefresh,
  opportunities,
  isLoading,
  error,
  lastUpdated,
}: {
  onSelect: (opp: ArbitrageOpportunity) => void
  onRefresh: () => void
  opportunities: ArbitrageOpportunity[]
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleSelect = (opp: ArbitrageOpportunity, index: number) => {
    setSelectedIndex(index)
    onSelect(opp)
  }

  const getEdgeColor = (edge: number) => {
    if (edge >= 2) return 'bg-emerald-500 text-white'
    if (edge >= 1) return 'bg-green-500/90 text-white'
    if (edge >= 0.5) return 'bg-lime-500/80 text-slate-900'
    return 'bg-yellow-500/70 text-slate-900'
  }

  return (
    <div className="glass-panel rounded-[20px] p-4 border border-amber-500/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-amber-400/80 mb-1">
            Option B: Live Feed
          </div>
          <div className="text-white font-semibold">OddsBlaze Opportunities</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50">{lastUpdated ? `Last updated: ${lastUpdated}` : 'No refresh yet'}</div>
          <div className="text-[10px] text-emerald-400/70">{opportunities.length} matches</div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-70"
        >
          {isLoading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
        {isLoading && <div className="text-xs text-white/60">Pulling latest OddsBlaze data...</div>}
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
        {opportunities.map((opp, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opp, i)}
            className={`
              w-full text-left p-2.5 rounded-lg transition border flex items-center gap-3
              ${selectedIndex === i 
                ? 'bg-amber-500/20 border-amber-500/50' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/30'}
            `}
          >
            <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold min-w-[48px] ${getEdgeColor(opp.edge)}`}>
              {opp.edge.toFixed(2)}%
            </span>
            
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm truncate">{opp.event}</div>
              <div className="text-white/50 text-xs">{opp.market}</div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-emerald-400 font-medium">{opp.legA.bookCode}</span>
              <span className="text-white/30">↔</span>
              <span className="text-amber-400 font-medium">{opp.legB.bookCode}</span>
            </div>
          </button>
        ))}
        {opportunities.length === 0 && !isLoading && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-sm text-white/50">
            No OddsBlaze opportunities available yet. Try Refresh.
          </div>
        )}
      </div>
    </div>
  )
}
