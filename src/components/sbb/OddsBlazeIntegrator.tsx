'use client'

import { useState } from 'react'
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
  const { updateIntakeField, setLaneSportsbook, setLaneState } = useSbbCockpitState()
  const [lastImported, setLastImported] = useState<string | null>(null)

  const handleImport = (data: any) => {
    // Populate intake fields
    updateIntakeField('event', data.legA?.player || data.event || '')
    updateIntakeField('market', `${data.market || 'Player Props'} - ${data.legA?.side} ${data.legA?.line}`)
    
    // Set leg A
    updateIntakeField('legA.sportsbook', data.legA?.sportsbook || '')
    updateIntakeField('legA.side', data.legA?.side || '')
    updateIntakeField('legA.odds', data.legA?.odds || '')
    
    // Set leg B  
    updateIntakeField('legB.sportsbook', data.legB?.sportsbook || '')
    updateIntakeField('legB.side', data.legB?.side || '')
    updateIntakeField('legB.odds', data.legB?.odds || '')

    // Set lane assignments
    setLaneSportsbook('A', data.legA?.sportsbook)
    setLaneSportsbook('B', data.legB?.sportsbook)
    setLaneState('A', 'attached')
    setLaneState('B', 'attached')

    setLastImported(`${data.edge}% ${data.legA?.sportsbook}↔${data.legB?.sportsbook}`)
    
    // Scroll to interactive panel
    document.getElementById('sbb-interactive-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="oddsblaze-integrator" className="mb-8 animate-in">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <OddsBlazeLiveScanner onSelect={handleImport} />
        <OddsBlazeUrlParser onImport={handleImport} />
      </div>
    </section>
  )
}
