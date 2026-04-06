'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#00d9ff] mb-3">🎯 GNL Sportsbook Tracker</h1>
          <p className="text-gray-400">Arbitrage betting tools for bankroll management</p>
        </div>

        <div className="grid gap-6 max-w-4xl mx-auto">
          <Link href="/calculator" className="block">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-8 text-center hover:transform hover:scale-[1.02] hover:border-[#00d9ff] transition-all cursor-pointer">
              <div className="text-5xl mb-4">🧮</div>
              <h2 className="text-2xl font-bold text-[#00d9ff] mb-3">Arbitrage Calculator</h2>
              <p className="text-gray-400 mb-6">
                Calculate optimal bet stakes across sportsbooks with real-time profit analysis
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-full hover:scale-105 transition-all">
                Open Calculator
              </button>
            </div>
          </Link>

          <Link href="/tracker" className="block">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-8 text-center hover:transform hover:scale-[1.02] hover:border-[#00d9ff] transition-all cursor-pointer">
              <div className="text-5xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-[#00d9ff] mb-3">Bankroll Tracker</h2>
              <p className="text-gray-400 mb-6">
                Track deposits, withdrawals, and balances across all your sportsbooks
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-full hover:scale-105 transition-all">
                Open Tracker
              </button>
            </div>
          </Link>

          <Link href="/bets" className="block">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-8 text-center hover:transform hover:scale-[1.02] hover:border-[#00d9ff] transition-all cursor-pointer">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-[#00d9ff] mb-3">Bet History</h2>
              <p className="text-gray-400 mb-6">
                Log and track all your arbitrage bets with Excel export/import
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-full hover:scale-105 transition-all">
                Open Bet History
              </button>
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-[#ffa502]/10 border border-[#ffa502]/30 rounded-xl p-6 text-center">
          <h3 className="text-[#ffa502] font-bold mb-2">🏖️ Sandbox Environment Available</h3>
          <p className="text-gray-400 mb-4">Test new features safely without affecting your real data</p>
          <div className="flex justify-center gap-4">
            <Link href="/calculator?sandbox=true" className="text-[#00d9ff] hover:underline">Sandbox Calculator</Link>
            <span className="text-gray-600">•</span>
            <Link href="/tracker?sandbox=true" className="text-[#00d9ff] hover:underline">Sandbox Tracker</Link>
            <span className="text-gray-600">•</span>
            <Link href="/bets?sandbox=true" className="text-[#00d9ff] hover:underline">Sandbox Bets</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
