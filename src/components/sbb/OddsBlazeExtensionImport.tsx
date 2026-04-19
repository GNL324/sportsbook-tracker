'use client'

import { useState, useCallback } from 'react'

interface ExtensionOpportunity {
  id: string
  edge: number
  market: string
  event: string
  legA: {
    sportsbook: string
    bookCode: string
    side: string
    line: string
    odds: string
    betUrl?: string
  }
  legB: {
    sportsbook: string
    bookCode: string
    side: string
    line: string
    odds: string
    betUrl?: string
  }
}

interface ExtensionPayload {
  fetchedAt: string
  pageUrl: string
  totalRowsScanned: number
  totalOpportunities: number
  opportunities: ExtensionOpportunity[]
}

interface ParsedResult {
  edge: number
  market: string
  event: string
  legA: {
    sportsbook: string
    bookCode: string
    side: string
    line: string
    odds: string
    betUrl: string
  }
  legB: {
    sportsbook: string
    bookCode: string
    side: string
    line: string
    odds: string
    betUrl: string
  }
}

export function OddsBlazeExtensionImport({
  onImport,
}: {
  onImport: (opportunities: ParsedResult[]) => void
}) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parsedCount, setParsedCount] = useState<number | null>(null)

  const parseInput = useCallback((text: string): ExtensionPayload | null => {
    if (!text.trim()) return null
    
    try {
      const parsed = JSON.parse(text) as ExtensionPayload
      
      // Validate structure
      if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
        throw new Error('Invalid JSON: missing opportunities array')
      }
      
      if (!parsed.totalOpportunities || parsed.totalOpportunities < 0) {
        throw new Error('Invalid JSON: missing totalOpportunities')
      }
      
      return parsed
    } catch {
      return null
    }
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setInput(clipboardText)
      
      const parsed = parseInput(clipboardText)
      if (parsed) {
        setParsedCount(parsed.totalOpportunities)
        setError(null)
      } else {
        setError('Clipboard does not contain valid OddsBlaze JSON')
        setParsedCount(null)
      }
    } catch {
      setError('Could not read clipboard. Please paste manually.')
    }
  }, [parseInput])

  const handleImport = useCallback(() => {
    const parsed = parseInput(input)
    if (!parsed) {
      setError('Invalid JSON. Please paste the full output from the Chrome extension.')
      return
    }

    if (parsed.opportunities.length === 0) {
      setError('No opportunities found in JSON')
      return
    }

    // Normalize to SBB format with guaranteed betUrl
    const normalized: ParsedResult[] = parsed.opportunities.map(opp => ({
      edge: opp.edge,
      market: opp.market,
      event: opp.event,
      legA: {
        sportsbook: opp.legA.sportsbook,
        bookCode: opp.legA.bookCode,
        side: opp.legA.side,
        line: opp.legA.line,
        odds: opp.legA.odds,
        betUrl: opp.legA.betUrl || '',
      },
      legB: {
        sportsbook: opp.legB.sportsbook,
        bookCode: opp.legB.bookCode,
        side: opp.legB.side,
        line: opp.legB.line,
        odds: opp.legB.odds,
        betUrl: opp.legB.betUrl || '',
      },
    }))

    onImport(normalized)
    setError(null)
    setInput('')
    setParsedCount(null)
  }, [input, onImport, parseInput])

  const handleClear = useCallback(() => {
    setInput('')
    setError(null)
    setParsedCount(null)
  }, [])

  return (
    <div className="glass-panel rounded-[20px] p-4 border border-emerald-500/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-400/80 mb-1">
            Option C: Chrome Extension
          </div>
          <div className="text-white font-semibold">Import from Extension</div>
        </div>
        <div className="pill pill-emerald text-xs">
          4 books only
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-white/60 text-sm">
          Use the Chrome extension on OddsBlaze to scan and copy JSON, then paste here.
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePaste}
            className="rounded-lg bg-emerald-500/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            📋 Paste from Clipboard
          </button>
          
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/20"
            >
              Clear
            </button>
          )}
        </div>

        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            const parsed = parseInput(e.target.value)
            if (parsed) {
              setParsedCount(parsed.totalOpportunities)
              setError(null)
            } else {
              setParsedCount(null)
            }
          }}
          placeholder="Paste JSON from Chrome extension here..."
          className="w-full h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none resize-none"
        />

        {parsedCount !== null && parsedCount > 0 && (
          <div className="text-emerald-400 text-sm">
            ✓ Found {parsedCount} opportunity{parsedCount !== 1 ? 'ies' : 'y'}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={!parsedCount || parsedCount === 0}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {parsedCount ? `Import ${parsedCount} Opportunities` : 'Import Opportunities'}
        </button>
      </div>
    </div>
  )
}
