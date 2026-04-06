'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CalculatorPage() {
  const [odds1, setOdds1] = useState('')
  const [odds2, setOdds2] = useState('')
  const [totalStake, setTotalStake] = useState('')
  const [results, setResults] = useState<any>(null)

  const calculateArb = () => {
    const o1 = parseFloat(odds1)
    const o2 = parseFloat(odds2)
    const stake = parseFloat(totalStake)

    if (!o1 || !o2 || !stake) return

    const d1 = o1 > 0 ? (o1 / 100) + 1 : 1 + (100 / Math.abs(o1))
    const d2 = o2 > 0 ? (o2 / 100) + 1 : 1 + (100 / Math.abs(o2))

    const arbPercent = (1 / d1) + (1 / d2)
    const isArb = arbPercent < 1

    const stake1 = (stake * (1 / d1)) / arbPercent
    const stake2 = (stake * (1 / d2)) / arbPercent
    const profit = (stake1 * d1) - stake
    const roi = (profit / stake) * 100

    setResults({
      stake1: stake1.toFixed(2),
      stake2: stake2.toFixed(2),
      profit: profit.toFixed(2),
      roi: roi.toFixed(2),
      isArb,
      arbPercent: (arbPercent * 100).toFixed(2)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-[#00d9ff] hover:underline">← Back to Home</Link>
        </div>

        <h1 className="text-3xl font-bold text-[#00d9ff] mb-2">🧮 Arbitrage Calculator</h1>
        <p className="text-gray-400 mb-8">Calculate optimal bet stakes for guaranteed profit</p>

        <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-400 mb-2">Odds 1 (American)</label>
              <input
                type="number"
                className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d9ff]"
                placeholder="+150 or -110"
                value={odds1}
                onChange={(e) => setOdds1(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Odds 2 (American)</label>
              <input
                type="number"
                className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d9ff]"
                placeholder="+150 or -110"
                value={odds2}
                onChange={(e) => setOdds2(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Total Stake ($)</label>
            <input
              type="number"
              className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d9ff]"
              placeholder="100"
              value={totalStake}
              onChange={(e) => setTotalStake(e.target.value)}
            />
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={calculateArb}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-lg hover:scale-105 transition-all"
            >
              Calculate
            </button>
            <button
              onClick={() => { setOdds1(''); setOdds2(''); setTotalStake(''); setResults(null); }}
              className="px-6 py-3 bg-[#00d9ff]/20 border border-[#00d9ff]/50 text-[#00d9ff] font-bold rounded-lg hover:bg-[#00d9ff]/30 transition-all"
            >
              Reset
            </button>
          </div>

          {results && (
            <div className={`p-6 rounded-xl ${results.isArb ? 'bg-[#00ff88]/10 border-[#00ff88]/50' : 'bg-[#ff4757]/10 border-[#ff4757]/50'} border`}>
              <h3 className={`text-xl font-bold mb-4 ${results.isArb ? 'text-[#00ff88]' : 'text-[#ff4757]'}`}>
                {results.isArb ? '✅ Arbitrage Opportunity!' : '❌ No Arbitrage'}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Stake 1</div>
                  <div className="text-2xl font-bold">${results.stake1}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Stake 2</div>
                  <div className="text-2xl font-bold">${results.stake2}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Guaranteed Profit</div>
                  <div className="text-2xl font-bold text-[#00ff88]">${results.profit}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">ROI</div>
                  <div className="text-2xl font-bold text-[#00ff88]">{results.roi}%</div>
                </div>
              </div>

              {!results.isArb && (
                <p className="mt-4 text-[#ff4757] text-sm">
                  Arb %: {results.arbPercent}% (needs to be under 100% for profit)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
