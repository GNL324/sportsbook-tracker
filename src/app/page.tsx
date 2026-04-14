'use client'

import Link from 'next/link'

const tools = [
  {
    href: '/calculator',
    icon: '⟠',
    title: 'Arbitrage Calculator',
    desc: 'Calculate optimal stakes across sportsbooks for guaranteed profit',
    stat: '2-WAY / 3-WAY',
  },
  {
    href: '/tracker',
    icon: '◆',
    title: 'Bankroll Tracker',
    desc: 'Track deposits, withdrawals, and balances across all books',
    stat: '4 SPORTSBOOKS',
  },
  {
    href: '/bets',
    icon: '↗',
    title: 'Bet History',
    desc: 'Log bets, track win rate, and analyze your performance',
    stat: 'WIN / LOSS / PENDING',
  },
]

export default function HomePage() {
  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-[--border] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[--accent] flex items-center justify-center text-white font-black text-sm">G</div>
              <span className="font-bold text-lg tracking-tight">GNL Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[--text-muted] font-mono uppercase tracking-widest">Sportsbook Tools</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="text-center mb-16 animate-in">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[--border] bg-[--bg-card]">
              <span className="w-2 h-2 rounded-full bg-[--accent] animate-pulse"></span>
              <span className="text-[12px] text-[--text-secondary] font-medium tracking-wide uppercase">Live Tools</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-4">
              Sharp Bettor<br />
              <span className="text-[--accent]">Toolkit</span>
            </h1>
            <p className="text-[--text-secondary] text-lg max-w-md mx-auto leading-relaxed">
              Arbitrage calculator, bankroll tracker, and bet history — everything you need to stay sharp.
            </p>
          </div>

          {/* Tool Cards */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl w-full animate-in" style={{ animationDelay: '0.1s' }}>
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="group">
                <div className="card p-6 h-full flex flex-col hover:bg-[--bg-card-hover] hover:border-[--border-focus]">
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-3xl">{tool.icon}</span>
                    <span className="text-[10px] font-mono text-[--text-muted] tracking-wider uppercase">{tool.stat}</span>
                  </div>
                  <h2 className="font-bold text-[15px] mb-2 group-hover:text-[--accent] transition-colors">{tool.title}</h2>
                  <p className="text-[--text-secondary] text-[13px] leading-relaxed flex-1">{tool.desc}</p>
                  <div className="mt-6 pt-4 border-t border-[--border] flex items-center justify-between">
                    <span className="text-[12px] text-[--text-muted] font-medium">Open</span>
                    <svg className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[--border] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-[11px] text-[--text-muted] font-mono">GNL324</span>
            <span className="text-[11px] text-[--text-muted] font-mono">v1.2.0</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
