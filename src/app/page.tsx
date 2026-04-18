'use client'

import { SbbInteractivePanel } from '@/components/sbb/SbbInteractivePanel'
import { SbbMockup } from '@/components/sbb/SbbMockup'

export default function HomePage() {
  return (
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
                <div className="text-2xl font-black tracking-tight text-white mt-1">UI Mockup Preview</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="pill pill-blue">UI ONLY MOCKUP</span>
              <span className="pill pill-green">Dual-window cockpit</span>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/38">v0.2.0</span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <SbbMockup />
          <SbbInteractivePanel />
        </main>
      </div>
    </div>
  )
}
