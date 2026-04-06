'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#00d9ff] mb-3">🎯 GNL Hub</h1>
          <p className="text-gray-400">Sports betting arbitrage tools</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link href="/calculator" className="block">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-8 text-center hover:transform hover:scale-[1.02] hover:border-[#00d9ff] transition-all cursor-pointer h-full">
              <div className="text-5xl mb-4">🧮</div>
              <h2 className="text-xl font-bold text-[#00d9ff] mb-3">Arbitrage Calculator</h2>
              <p className="text-gray-400 mb-6 text-sm">Calculate optimal bet stakes across sportsbooks</p>
              <button className="px-6 py-2 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-full hover:scale-105 transition-all">Open</button>
            </div>
          </Link>

          <Link href="/tracker" className="block">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-8 text-center hover:transform hover:scale-[1.02] hover:border-[#00d9ff] transition-all cursor-pointer h-full">
              <div className="text-5xl mb-4">💰</div>
              <h2 className="text-xl font-bold text-[#00d9ff] mb-3">Bankroll Tracker</h2>
              <p className="text-gray-400 mb-6 text-sm">Track deposits, withdrawals, and balances</p>
              <button className="px-6 py-2 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-full hover:scale-105 transition-all">Open</button>
            </div>
          </Link>

          <Link href="/bets" className="block">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-8 text-center hover:transform hover:scale-[1.02] hover:border-[#00d9ff] transition-all cursor-pointer h-full">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-xl font-bold text-[#00d9ff] mb-3">Bet History</h2>
              <p className="text-gray-400 mb-6 text-sm">Log and track all your arbitrage bets</p>
              <button className="px-6 py-2 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-full hover:scale-105 transition-all">Open</button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
