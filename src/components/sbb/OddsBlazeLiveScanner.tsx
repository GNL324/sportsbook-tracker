'use client'

import { useState } from 'react'
import type { Sportsbook } from '@/lib/sbb'

interface ArbitrageOpportunity {
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

// Live data from OddsBlaze (BetRivers, DraftKings, BetMGM, theScore only)
const LIVE_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    edge: 2.46,
    market: 'Points + Rebounds + Assists',
    event: 'Jordan Goodwin',
    legA: { sportsbook: 'betrivers', bookCode: 'R', player: 'Jordan Goodwin', side: 'Over', line: '17.5', odds: '+117' },
    legB: { sportsbook: 'draftkings', bookCode: 'D', player: 'Jordan Goodwin', side: 'Under', line: '17.5', odds: '-106' },
  },
  {
    edge: 1.22,
    market: 'Player Rebounds',
    event: 'Rui Hachimura',
    legA: { sportsbook: 'betmgm', bookCode: 'M', player: 'Rui Hachimura', side: 'Over', line: '3.5', odds: '+100' },
    legB: { sportsbook: 'draftkings', bookCode: 'D', player: 'Rui Hachimura', side: 'Under', line: '3.5', odds: '+105' },
  },
  {
    edge: 0.91,
    market: 'Player Rebounds',
    event: 'Desmond Bane',
    legA: { sportsbook: 'betmgm', bookCode: 'M', player: 'Desmond Bane', side: 'Over', line: '4.5', odds: '+160' },
    legB: { sportsbook: 'draftkings', bookCode: 'D', player: 'Desmond Bane', side: 'Under', line: '4.5', odds: '-154' },
  },
  {
    edge: 0.80,
    market: 'Player Rebounds',
    event: 'Victor Wembanyama',
    legA: { sportsbook: 'draftkings', bookCode: 'D', player: 'Victor Wembanyama', side: 'Over', line: '12.5', odds: '+125' },
    legB: { sportsbook: 'betrivers', bookCode: 'R', player: 'Victor Wembanyama', side: 'Under', line: '12.5', odds: '-121' },
  },
  {
    edge: 0.58,
    market: 'Threes Made',
    event: 'Jalen Green',
    legA: { sportsbook: 'betrivers', bookCode: 'R', player: 'Jalen Green', side: 'Over', line: '2.5', odds: '+195' },
    legB: { sportsbook: 'betmgm', bookCode: 'M', player: 'Jalen Green', side: 'Under', line: '2.5', odds: '-190' },
  },
  {
    edge: 0.36,
    market: 'Points + Assists',
    event: 'Andre Drummond',
    legA: { sportsbook: 'draftkings', bookCode: 'D', player: 'Andre Drummond', side: 'Over', line: '9.5', odds: '+137' },
    legB: { sportsbook: 'betmgm', bookCode: 'M', player: 'Andre Drummond', side: 'Under', line: '9.5', odds: '-135' },
  },
  {
    edge: 0.22,
    market: 'Player Points',
    event: 'Ausar Thompson',
    legA: { sportsbook: 'betmgm', bookCode: 'M', player: 'Ausar Thompson', side: 'Over', line: '8.5', odds: '-115' },
    legB: { sportsbook: 'betrivers', bookCode: 'R', player: 'Ausar Thompson', side: 'Under', line: '8.5', odds: '+116' },
  },
  {
    edge: 0.12,
    market: 'Threes Made',
    event: 'Jalen Green',
    legA: { sportsbook: 'betrivers', bookCode: 'R', player: 'Jalen Green', side: 'Over', line: '2.5', odds: '+195' },
    legB: { sportsbook: 'draftkings', bookCode: 'D', player: 'Jalen Green', side: 'Under', line: '2.5', odds: '-194' },
  },
]

export function OddsBlazeLiveScanner({ onSelect }: { onSelect: (opp: ArbitrageOpportunity) => void }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [lastUpdate] = useState<string>(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))

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
    <div className="glass-panel rounded-[20px] p-4 border border-amber-500/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-amber-400/80 mb-1">
            Option B: Live Feed
          </div>
          <div className="text-white font-semibold">OddsBlaze Opportunities</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50">Updated {lastUpdate}</div>
          <div className="text-[10px] text-emerald-400/70">{LIVE_OPPORTUNITIES.length} matches</div>
        </div>
      </div>

      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
        {LIVE_OPPORTUNITIES.map((opp, i) => (
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
      </div>
    </div>
  )
}
