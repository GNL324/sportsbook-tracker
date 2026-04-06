'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const sportsbooks = ['DraftKings', 'BetMGM', 'theScore BET', 'BetRivers']

export default function CalculatorPage() {
  const [odds1, setOdds1] = useState('')
  const [odds2, setOdds2] = useState('')
  const [totalStake, setTotalStake] = useState('')
  const [sportsbook1, setSportsbook1] = useState('DraftKings')
  const [sportsbook2, setSportsbook2] = useState('BetMGM')
  const [results, setResults] = useState<any>(null)
  const [balances, setBalances] = useState<{[key: string]: number}>({})

  useEffect(() => {
    const transactions = JSON.parse(localStorage.getItem('gnl_tracker_transactions') || '[]')
    const sbBalances: {[key: string]: number} = {}
    sportsbooks.forEach(sb => {
      sbBalances[sb] = transactions
        .filter((t: any) => t.sportsbook === sb)
        .reduce((acc: number, t: any) => t.type === 'deposit' ? acc + t.amount : acc - t.amount, 0)
    })
    setBalances(sbBalances)
  }, [])

  const getMaxStake = () => {
    const bal1 = balances[sportsbook1] || 0
    const bal2 = balances[sportsbook2] || 0
    const o1 = parseFloat(odds1)
    const o2 = parseFloat(odds2)

    if (!o1 || !o2 || bal1 <= 0 || bal2 <= 0) return 0

    const d1 = o1 > 0 ? (o1 / 100) + 1 : 1 + (100 / Math.abs(o1))
    const d2 = o2 > 0 ? (o2 / 100) + 1 : 1 + (100 / Math.abs(o2))

    // Max stake where both bets fit in balances
    const arbPercent = (1 / d1) + (1 / d2)
    const maxFromBal1 = bal1 * arbPercent / (1 / d1)
    const maxFromBal2 = bal2 * arbPercent / (1 / d2)
    
    return Math.floor(Math.min(maxFromBal1, maxFromBal2))
  }

  const calculateArb = () => {
    const o1 = parseFloat(odds1)
    const o2 = parseFloat(odds2)
    const stake = parseFloat(totalStake)

    if (!o1 || !o2 || !stake) return

    const d1 = o1 > 0 ? (o1 / 100) + 1 : 1 + (100 / Math.abs(o1))
    const d2 = o2 > 0 ? (o2 / 100) + 1 : 1 + (100 / Math.abs(o2))

    const arbPercent = (1 / d1) + (1 / d2)
    const isArb = arbPercent < 1

    const stake1 = Math.round((stake * (1 / d1)) / arbPercent)
    const stake2 = Math.round((stake * (1 / d2)) / arbPercent)
    const profit = (stake1 * d1) - stake
    const roi = (profit / stake) * 100

    setResults({
      stake1: stake1.toFixed(0),
      stake2: stake2.toFixed(0),
      profit: profit.toFixed(2),
      roi: roi.toFixed(2),
      isArb,
      arbPercent: (arbPercent * 100).toFixed(2),
      sb1: sportsbook1,
      sb2: sportsbook2,
      balance1: balances[sportsbook1] || 0,
      balance2: balances[sportsbook2] || 0
    })
  }

  const setMaxStake = () => {
    const max = getMaxStake()
    if (max > 0) {
      setTotalStake(max.toString())
    }
  }

  const addToTracker = () => {
    if (!results) return
    
    const transactions = JSON.parse(localStorage.getItem('gnl_tracker_transactions') || '[]')
    
    transactions.unshift({
      id: Date.now(),
      type: 'withdrawal',
      amount: parseFloat(results.stake1),
      sportsbook: results.sb1,
      date: new Date().toISOString().split('T')[0],
      notes: `Arb bet: ${results.sb2} stake $${results.stake2}`
    })
    
    transactions.unshift({
      id: Date.now() + 1,
      type: 'withdrawal',
      amount: parseFloat(results.stake2),
      sportsbook: results.sb2,
      date: new Date().toISOString().split('T')[0],
      notes: `Arb bet: ${results.sb1} stake $${results.stake1}`
    })
    
    localStorage.setItem('gnl_tracker_transactions', JSON.stringify(transactions))
    alert('✅ Bets added to tracker!')
    
    const sbBalances: {[key: string]: number} = {}
    sportsbooks.forEach(sb => {
      sbBalances[sb] = transactions
        .filter((t: any) => t.sportsbook === sb)
        .reduce((acc: number, t: any) => t.type === 'deposit' ? acc + t.amount : acc - t.amount, 0)
    })
    setBalances(sbBalances)
  }

  const maxStake = getMaxStake()

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
              <label className="block text-gray-400 mb-2">Sportsbook 1</label>
              <select
                value={sportsbook1}
                onChange={(e) => setSportsbook1(e.target.value)}
                className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d9ff]"
              >
                {sportsbooks.map(sb => (
                  <option key={sb} value={sb}>{sb}</option>
                ))}
              </select>
              {balances[sportsbook1] !== undefined && (
                <div className="text-sm mt-1">
                  <span className="text-gray-400">Balance: </span>
                  <span className={balances[sportsbook1] >= 0 ? 'text-[#00ff88]' : 'text-[#ff4757]'}>
                    ${balances[sportsbook1].toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Sportsbook 2</label>
              <select
                value={sportsbook2}
                onChange={(e) => setSportsbook2(e.target.value)}
                className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d9ff]"
              >
                {sportsbooks.map(sb => (
                  <option key={sb} value={sb}>{sb}</option>
                ))}
              </select>
              {balances[sportsbook2] !== undefined && (
                <div className="text-sm mt-1">
                  <span className="text-gray-400">Balance: </span>
                  <span className={balances[sportsbook2] >= 0 ? 'text-[#00ff88]' : 'text-[#ff4757]'}>
                    ${balances[sportsbook2].toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-400">Total Stake ($)</label>
              {maxStake > 0 && (
                <button
                  onClick={setMaxStake}
                  className="text-sm px-3 py-1 bg-[#00d9ff]/20 border border-[#00d9ff]/50 text-[#00d9ff] rounded hover:bg-[#00d9ff]/30 transition-all"
                >
                  Set Max: ${maxStake}
                </button>
              )}
            </div>
            <input
              type="number"
              className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d9ff]"
              placeholder="100"
              value={totalStake}
              onChange={(e) => setTotalStake(e.target.value)}
            />
            {maxStake > 0 && (
              <div className="text-sm mt-1 text-[#00ff88]">
                💰 Maximum possible bet: ${maxStake} (based on current balances)
              </div>
            )}
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
                <div className="p-4 bg-black/30 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">{results.sb1}</div>
                  <div className="text-2xl font-bold text-[#00d9ff]">${results.stake1}</div>
                  <div className="text-sm text-gray-400">Balance: ${results.balance1.toFixed(2)}</div>
                  {parseFloat(results.stake1) > results.balance1 && (
                    <div className="text-[#ff4757] text-sm mt-1">⚠️ Insufficient funds!</div>
                  )}
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">{results.sb2}</div>
                  <div className="text-2xl font-bold text-[#00d9ff]">${results.stake2}</div>
                  <div className="text-sm text-gray-400">Balance: ${results.balance2.toFixed(2)}</div>
                  {parseFloat(results.stake2) > results.balance2 && (
                    <div className="text-[#ff4757] text-sm mt-1">⚠️ Insufficient funds!</div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Guaranteed Profit</div>
                  <div className="text-2xl font-bold text-[#00ff88]">${results.profit}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">ROI</div>
                  <div className="text-2xl font-bold text-[#00ff88]">{results.roi}%</div>
                </div>
              </div>

              {results.isArb && (
                <button
                  onClick={addToTracker}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-bold rounded-lg hover:scale-105 transition-all"
                >
                  💾 Add to Tracker
                </button>
              )}

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
