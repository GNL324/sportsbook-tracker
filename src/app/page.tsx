'use client'

import { SbbDashboard } from '@/components/sbb/SbbDashboard'

export default function HomePage() {
  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <div className="relative z-10 flex-1 flex flex-col">
        <header className="border-b border-[--border] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[--accent] flex items-center justify-center text-white font-black text-sm">S</div>
              <div>
                <div className="font-bold text-lg tracking-tight">Shared Sportsbook Browser</div>
                <div className="text-[11px] text-[--text-muted] font-mono uppercase tracking-wider">First executable implementation slice</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[--text-muted] font-mono uppercase tracking-wider">Status</div>
              <div className="badge badge-green mt-1">BUILD STARTED</div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <SbbDashboard />
          </div>
        </main>

        <footer className="border-t border-[--border] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-[11px] text-[--text-muted] font-mono">GNL324 • SBB</span>
            <span className="text-[11px] text-[--text-muted] font-mono">v0.1.0</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
