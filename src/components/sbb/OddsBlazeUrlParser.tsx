'use client'

import { useState, useEffect } from 'react'
import type { Sportsbook } from '@/lib/sbb'

type ParsedOpportunity = {
  edge: number
  market: string
  event: string
  legA: {
    sportsbook: Sportsbook
    side: string
    odds: string
    line: string
  }
  legB: {
    sportsbook: Sportsbook
    side: string
    odds: string
    line: string
  }
}

const BOOK_CODES: Record<string, Sportsbook> = {
  'R': 'betrivers',
  'M': 'betmgm', 
  'D': 'draftkings',
  'S': 'thescore',
}

export function OddsBlazeUrlParser({ onImport }: { onImport: (opp: ParsedOpportunity) => void }) {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<ParsedOpportunity | null>(null)
  const [error, setError] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const parseInput = () => {
    setError('')
    setParsed(null)

    // Text format: "2.46% Jordan Goodwin Over 17.5 +117 @ BetRivers"
    const match = input.match(/(\d+\.?\d*)\%\s+(.+?)\s+(Over|Under)\s+(\d+\.?\d*)\s+([+-]\d+).+?@\s*(BetRivers|BetMGM|DraftKings|theScore)/i)
    
    if (match) {
      const [, edge, player, side, line, odds, bookName] = match
      
      const opp: ParsedOpportunity = {
        edge: parseFloat(edge),
        market: 'Player Props',
        event: player.trim(),
        legA: {
          sportsbook: bookName.toLowerCase().replace('thescore', 'thescore') as Sportsbook,
          side: side.toLowerCase(),
          odds,
          line
        },
        legB: {
          sportsbook: bookName.toLowerCase() === 'betrivers' ? 'draftkings' : 'betrivers',
          side: side.toLowerCase() === 'over' ? 'under' : 'over',
          odds: '-110',
          line
        }
      }
      setParsed(opp)
      onImport(opp)
    } else {
      setError('Format: "2.46% Jordan Goodwin Over 17.5 +117 @ BetRivers"')
    }
  }

  return (
    <div className="glass-panel rounded-[20px] p-5 border border-emerald-500/30">
      <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-400/80 mb-3">
        Option A: Manual Import
      </div>
      
      <div className="text-white font-semibold mb-3">Paste from OddsBlaze</div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="2.46% Jordan Goodwin Over 17.5 +117 @ BetRivers"
          className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/30"
          onKeyDown={(e) => e.key === 'Enter' && parseInput()}
        />
        <button
          onClick={parseInput}
          className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition"
        >
          Import
        </button>
      </div>
      
      {error && <div className="mt-3 text-amber-400 text-sm">{error}</div>}
      
      {parsed && (
        <div className="mt-3 p-3 bg-emerald-500/10 rounded-lg">
          <div className="text-emerald-400 font-medium">
            ✓ {parsed.edge}% {parsed.legA.sportsbook.toUpperCase()} {parsed.legA.side} {parsed.legA.line}
          </div>
        </div>
      )}
    </div>
  )
}
