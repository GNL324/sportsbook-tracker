'use client'

import { useState, useEffect } from 'react'
import { OddsBlazeUrlParser } from './OddsBlazeUrlParser'
import { OddsBlazeLiveScanner, type ArbitrageOpportunity } from './OddsBlazeLiveScanner'
import { useSbbCockpitState } from '@/hooks/useSbbCockpitState'

const STORAGE_KEY = 'oddsblaze_live_feed'
const ODDSBLAZE_URL = 'https://oddsblaze.com/arbitrage'
const BOOK_CODE_MAP = {
  R: 'betrivers',
  D: 'draftkings',
  S: 'thescore',
  M: 'betmgm',
} as const

type SupportedBookCode = keyof typeof BOOK_CODE_MAP

type StoredFeed = {
  opportunities: ArbitrageOpportunity[]
  fetchedAt: string
}

function isSupportedBookCode(value: string): value is SupportedBookCode {
  return value in BOOK_CODE_MAP
}

function getRelativeTimestamp(isoTimestamp: string | null): string | null {
  if (!isoTimestamp) return null
  const updatedAt = new Date(isoTimestamp).getTime()
  if (Number.isNaN(updatedAt)) return null
  const diffMinutes = Math.max(0, Math.floor((Date.now() - updatedAt) / 60000))
  if (diffMinutes === 0) return 'just now'
  if (diffMinutes === 1) return '1 min ago'
  return `${diffMinutes} min ago`
}

function normalizeOpportunity(input: Partial<ArbitrageOpportunity>): ArbitrageOpportunity | null {
  if (!input.legA || !input.legB || typeof input.edge !== 'number') return null
  if (!input.legA.bookCode || !input.legB.bookCode) return null
  if (!isSupportedBookCode(input.legA.bookCode) || !isSupportedBookCode(input.legB.bookCode)) return null

  return {
    edge: input.edge,
    market: input.market || 'Player Props',
    event: input.event || input.legA.player || input.legB.player || 'Unknown',
    legA: {
      sportsbook: BOOK_CODE_MAP[input.legA.bookCode],
      bookCode: input.legA.bookCode,
      player: input.legA.player || input.event || 'Unknown',
      side: input.legA.side || '',
      line: input.legA.line || '',
      odds: input.legA.odds || '',
    },
    legB: {
      sportsbook: BOOK_CODE_MAP[input.legB.bookCode],
      bookCode: input.legB.bookCode,
      player: input.legB.player || input.event || 'Unknown',
      side: input.legB.side || '',
      line: input.legB.line || '',
      odds: input.legB.odds || '',
    },
  }
}

function parseJsonPayload(payload: unknown): ArbitrageOpportunity[] {
  if (!payload || typeof payload !== 'object') return []
  const list = (payload as { opportunities?: unknown[] }).opportunities
  if (!Array.isArray(list)) return []

  return list
    .map((item) => normalizeOpportunity(item as Partial<ArbitrageOpportunity>))
    .filter((item): item is ArbitrageOpportunity => Boolean(item))
}

function parseOddsBlazeHtml(html: string): ArbitrageOpportunity[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const rows = Array.from(doc.querySelectorAll('tr'))
  const parsed: ArbitrageOpportunity[] = []

  for (const row of rows) {
    const text = row.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    if (!text.includes('%')) continue

    const edgeMatch = text.match(/(\d+(?:\.\d+)?)%/)
    const bookMatches = [...text.matchAll(/\b([RDSM])\b/g)].map((match) => match[1]).filter(isSupportedBookCode)
    const oddsMatches = [...text.matchAll(/([+-]\d{2,4})/g)].map((match) => match[1])
    const sideLineMatches = [...text.matchAll(/\b(Over|Under)\s+(\d+(?:\.\d+)?)/gi)]

    if (!edgeMatch || bookMatches.length < 2 || oddsMatches.length < 2 || sideLineMatches.length < 2) continue

    const marketCandidate = row.querySelectorAll('td')[1]?.textContent?.trim() || 'Player Props'
    const eventCandidate = row.querySelectorAll('td')[2]?.textContent?.trim() || text.replace(edgeMatch[0], '').trim()

    const opportunity = normalizeOpportunity({
      edge: Number.parseFloat(edgeMatch[1]),
      market: marketCandidate,
      event: eventCandidate,
      legA: {
        bookCode: bookMatches[0],
        player: eventCandidate,
        side: sideLineMatches[0][1],
        line: sideLineMatches[0][2],
        odds: oddsMatches[0],
        sportsbook: BOOK_CODE_MAP[bookMatches[0]],
      },
      legB: {
        bookCode: bookMatches[1],
        player: eventCandidate,
        side: sideLineMatches[1][1],
        line: sideLineMatches[1][2],
        odds: oddsMatches[1],
        sportsbook: BOOK_CODE_MAP[bookMatches[1]],
      },
    })

    if (opportunity) {
      parsed.push(opportunity)
    }
  }

  return parsed
}

async function fetchOddsBlazeOpportunities(): Promise<ArbitrageOpportunity[]> {
  const sources = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(ODDSBLAZE_URL)}`,
    './data/oddsblaze.json',
  ]

  let lastError: Error | null = null

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json') || source.endsWith('.json')) {
        const json = await response.json()
        const opportunities = parseJsonPayload(json)
        if (opportunities.length > 0) return opportunities
        continue
      }

      const html = await response.text()
      const opportunities = parseOddsBlazeHtml(html)
      if (opportunities.length > 0) return opportunities
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error')
    }
  }

  throw lastError ?? new Error('Unable to fetch OddsBlaze data')
}

export function OddsBlazeIntegrator() {
  const [isMounted, setIsMounted] = useState(false)
  const [lastImported, setLastImported] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  
  // Defer hook call until after mount to avoid SSR issues
  const cockpitState = useSbbCockpitState()
  
  useEffect(() => {
    setIsMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as StoredFeed
      if (!Array.isArray(parsed.opportunities)) return
      setOpportunities(parsed.opportunities)
      setLastUpdated(parsed.fetchedAt)
    } catch (storageError) {
      console.warn('Failed to load OddsBlaze cache:', storageError)
    }
  }, [])

  const handleImport = (data: any) => {
    if (!isMounted) return
    
    // Populate intake fields
    cockpitState.updateIntakeField('event', data.legA?.player || data.event || '')
    cockpitState.updateIntakeField('market', `${data.market || 'Player Props'} - ${data.legA?.side} ${data.legA?.line}`)
    
    // Set leg A
    cockpitState.updateIntakeField('legA.sportsbook', data.legA?.sportsbook || '')
    cockpitState.updateIntakeField('legA.side', data.legA?.side || '')
    cockpitState.updateIntakeField('legA.odds', data.legA?.odds || '')
    
    // Set leg B  
    cockpitState.updateIntakeField('legB.sportsbook', data.legB?.sportsbook || '')
    cockpitState.updateIntakeField('legB.side', data.legB?.side || '')
    cockpitState.updateIntakeField('legB.odds', data.legB?.odds || '')

    // Set lane assignments
    if (data.legA?.sportsbook) {
      cockpitState.setLaneSportsbook('A', data.legA.sportsbook)
    }
    if (data.legB?.sportsbook) {
      cockpitState.setLaneSportsbook('B', data.legB.sportsbook)
    }
    cockpitState.setLaneState('A', 'attached')
    cockpitState.setLaneState('B', 'attached')

    setLastImported(`${data.edge}% ${data.legA?.sportsbook}↔${data.legB?.sportsbook}`)
    
    // Scroll to interactive panel (client-side only)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        document.getElementById('sbb-interactive-panel')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextOpportunities = await fetchOddsBlazeOpportunities()
      const fetchedAt = new Date().toISOString()

      setOpportunities(nextOpportunities)
      setLastUpdated(fetchedAt)

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          opportunities: nextOpportunities,
          fetchedAt,
        } satisfies StoredFeed),
      )
    } catch (refreshError) {
      console.error('OddsBlaze refresh failed:', refreshError)
      setError('Refresh failed. OddsBlaze may block browser scraping; showing the last cached snapshot if available.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="oddsblaze-integrator" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45 mb-1">
            Data Source
          </div>
          <h2 className="text-2xl font-bold text-white">OddsBlaze Integration</h2>
        </div>
        
        {lastImported && (
          <div className="pill pill-green text-sm">
            ✓ Imported: {lastImported}
          </div>
        )}
      </div>

      {isMounted ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <OddsBlazeLiveScanner
            onSelect={handleImport}
            onRefresh={handleRefresh}
            opportunities={opportunities}
            isLoading={isLoading}
            error={error}
            lastUpdated={getRelativeTimestamp(lastUpdated)}
          />
          <OddsBlazeUrlParser onImport={handleImport} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-[20px] p-5 border border-amber-500/30 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
            <div className="space-y-2">
              <div className="h-8 bg-white/5 rounded"></div>
              <div className="h-8 bg-white/5 rounded"></div>
              <div className="h-8 bg-white/5 rounded"></div>
            </div>
          </div>
          <div className="glass-panel rounded-[20px] p-5 border border-emerald-500/30 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
            <div className="h-10 bg-white/5 rounded"></div>
          </div>
        </div>
      )}
    </section>
  )
}
