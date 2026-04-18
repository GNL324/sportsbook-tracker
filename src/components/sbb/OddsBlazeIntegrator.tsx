'use client'

import { useState, useEffect } from 'react'
import { OddsBlazeUrlParser } from './OddsBlazeUrlParser'
import { OddsBlazeLiveScanner } from './OddsBlazeLiveScanner'
import { useSbbCockpitState } from '@/hooks/useSbbCockpitState'

type ArbitrageOpportunity = {
  edge: number
  market: string
  event: string
  legA: {
    sportsbook: 'betrivers' | 'betmgm' | 'draftkings' | 'thescore'
    bookCode: string
    player: string
    side: string
    line: string
    odds: string
  }
  legB: {
    sportsbook: 'betrivers' | 'betmgm' | 'draftkings' | 'thescore'
    bookCode: string
    player: string
    side: string
    line: string
    odds: string
  }
}

export function OddsBlazeIntegrator() {
  const [isMounted, setIsMounted] = useState(false)
  const [lastImported, setLastImported] = useState<string | null>(null)
  
  // Defer hook call until after mount to avoid SSR issues
  const cockpitState = useSbbCockpitState()
  
  useEffect(() => {
    setIsMounted(true)
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
          <OddsBlazeLiveScanner onSelect={handleImport} />
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
