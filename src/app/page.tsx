'use client'

import { useState } from 'react'

import { SbbInteractivePanel } from '@/components/sbb/SbbInteractivePanel'
import { SbbSessionControlPanel } from '@/components/sbb/SbbSessionControlPanel'
import { OddsBlazeIntegrator } from '@/components/sbb/OddsBlazeIntegrator'
import { SbbCockpitStateProvider } from '@/hooks/useSbbCockpitState'

export default function HomePage() {
  const [showSessionPanel, setShowSessionPanel] = useState(false)

  return (
    <SbbCockpitStateProvider>
      <div className="sbb-shell min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-5 py-5 md:px-8 md:py-8">
          <header className="glass-panel mb-6 rounded-[26px] px-6 py-5 md:px-8 md:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-400 text-lg font-black text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.28)]">
                  SB
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.26em] text-white/45">Shared Sportsbook Browser</div>
                  <div className="text-2xl font-black tracking-tight text-white mt-1">Execution Cockpit LIVE</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="pill pill-green">INTERACTIVE</span>
                <span className="pill pill-blue">Dual-window control</span>
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/38">v0.4.0</span>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6">
            <OddsBlazeIntegrator />
            <SbbInteractivePanel />
            <section className="glass-panel rounded-[24px] p-5 md:p-6">
              <button
                type="button"
                onClick={() => setShowSessionPanel((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
                aria-expanded={showSessionPanel}
              >
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Advanced controls</div>
                  <div className="text-white font-bold text-xl mt-1">Shared Sportsbook Browser</div>
                </div>
                <span className="pill pill-blue">{showSessionPanel ? 'Hide' : 'Show'}</span>
              </button>

              {showSessionPanel && (
                <div className="mt-5">
                  <SbbSessionControlPanel />
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </SbbCockpitStateProvider>
  )
}
