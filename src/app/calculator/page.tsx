'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const sportsbooks = ['DraftKings', 'BetMGM', 'theScore BET', 'BetRivers']
const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Other']

const sportsbookMap: { [key: string]: string } = {
  'M': 'BetMGM', 'R': 'BetRivers', 'S': 'theScore BET', 'D': 'DraftKings',
  'BET': 'BetMGM', 'DK': 'DraftKings', 'DV': 'DraftKings', 'RS': 'BetRivers', 'SC': 'theScore BET'
}

export default function CalculatorPage() {
  const [odds1, setOdds1] = useState('')
  const [odds2, setOdds2] = useState('')
  const [totalStake, setTotalStake] = useState('')
  const [sportsbook1, setSportsbook1] = useState('DraftKings')
  const [sportsbook2, setSportsbook2] = useState('BetMGM')
  const [sport, setSport] = useState('NBA')
  const [event, setEvent] = useState('')
  const [betType, setBetType] = useState('')
  const [results, setResults] = useState<any>(null)
  const [balances, setBalances] = useState<{ [key: string]: number }>({})
  const [showBetForm, setShowBetForm] = useState(false)
  const [showPasteWindow, setShowPasteWindow] = useState(false)
  const [pasteInput, setPasteInput] = useState('')

  useEffect(() => {
    const transactions = JSON.parse(localStorage.getItem('gnl_tracker_transactions') || '[]')
    const sbBalances: { [key: string]: number } = {}
    sportsbooks.forEach(sb => {
      sbBalances[sb] = transactions
        .filter((t: any) => t.sportsbook === sb)
        .reduce((acc: number, t: any) => t.type === 'deposit' ? acc + t.amount : acc - t.amount, 0)
    })
    setBalances(sbBalances)
  }, [])

  const parseBettingSlip = (text: string) => {
    const lines = text.split('\n').map(l => l.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')).filter(l => l)
    let betType = '', event = '', detectedSbs: string[] = [], detectedOdds: string[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line === '$' || line === 'NY' || line === 'S') continue
      if (line.match(/^\$\s*\d+\.?\d*$/)) continue
      if (line.match(/^\d+\.?\d*$/)) continue
      if (i === 0 && line.includes('+') && !line.match(/^[+\-\u2212]\d+$/)) betType = line
      if (line.includes('@') && (line.includes('-') || line.match(/\d+\s*minutes?/i))) event = line.split('-')[0].trim()
      if (line === 'M' || line === 'R' || line === 'S' || line === 'D' || line === 'BET' || line === 'DK' || line === 'DV' || line === 'RS' || line === 'SC') {
        const sb = sportsbookMap[line]
        if (sb && !detectedSbs.includes(sb)) detectedSbs.push(sb)
      }
      // Odds: match lines that ARE just odds (e.g. +110, -105) after stripping all whitespace and unicode
      const stripped = line.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
      const oddsMatch = stripped.match(/^([+\-\u2212])(\d{2,4})$/)
      if (oddsMatch) {
        const sign = oddsMatch[1] === '\u2212' ? '-' : oddsMatch[1]
        const oddsStr = sign + oddsMatch[2]
        if (!detectedOdds.includes(oddsStr)) detectedOdds.push(oddsStr)
      }
    }
    return { betType, event, sb1: detectedSbs[0] || '', sb2: detectedSbs[1] || '', odds1: detectedOdds[0] || '', odds2: detectedOdds[1] || '' }
  }

  const handlePaste = () => {
    const parsed = parseBettingSlip(pasteInput)
    if (parsed.odds1) setOdds1(parsed.odds1)
    if (parsed.odds2) setOdds2(parsed.odds2)
    if (parsed.sb1) setSportsbook1(parsed.sb1)
    if (parsed.sb2) setSportsbook2(parsed.sb2)
    if (parsed.betType) setBetType(parsed.betType)
    if (parsed.event) setEvent(parsed.event)
    setShowPasteWindow(false)
    setPasteInput('')
    setResults(null)
    setShowBetForm(false)
  }

  const getMaxStake = () => {
    const bal1 = balances[sportsbook1] || 0
    const bal2 = balances[sportsbook2] || 0
    const o1 = parseFloat(odds1), o2 = parseFloat(odds2)
    if (!o1 || !o2 || bal1 <= 0 || bal2 <= 0) return 0
    const d1 = o1 > 0 ? (o1 / 100) + 1 : 1 + (100 / Math.abs(o1))
    const d2 = o2 > 0 ? (o2 / 100) + 1 : 1 + (100 / Math.abs(o2))
    const arbPercent = (1 / d1) + (1 / d2)
    return Math.floor(Math.min(bal1 * arbPercent / (1 / d1), bal2 * arbPercent / (1 / d2)))
  }

  const calculateArb = () => {
    const o1 = parseFloat(odds1), o2 = parseFloat(odds2), stake = parseFloat(totalStake)
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
      stake1: stake1.toFixed(0), stake2: stake2.toFixed(0),
      profit: profit.toFixed(2), roi: roi.toFixed(2),
      isArb, arbPercent: (arbPercent * 100).toFixed(2),
      sb1: sportsbook1, sb2: sportsbook2,
      balance1: balances[sportsbook1] || 0, balance2: balances[sportsbook2] || 0,
      odds1, odds2
    })
    setShowBetForm(false)
  }

  const setMaxStake = () => { const max = getMaxStake(); if (max > 0) setTotalStake(max.toString()) }

  const addToTracker = () => {
    if (!results) return
    const transactions = JSON.parse(localStorage.getItem('gnl_tracker_transactions') || '[]')
    transactions.unshift({ id: Date.now(), type: 'withdrawal', amount: parseFloat(results.stake1), sportsbook: results.sb1, date: new Date().toISOString().split('T')[0], notes: `Arb bet: ${results.sb2} stake $${results.stake2}` })
    transactions.unshift({ id: Date.now() + 1, type: 'withdrawal', amount: parseFloat(results.stake2), sportsbook: results.sb2, date: new Date().toISOString().split('T')[0], notes: `Arb bet: ${results.sb1} stake $${results.stake1}` })
    localStorage.setItem('gnl_tracker_transactions', JSON.stringify(transactions))
    alert('Bets added to tracker!')
    const sbBalances: { [key: string]: number } = {}
    sportsbooks.forEach(sb => { sbBalances[sb] = transactions.filter((t: any) => t.sportsbook === sb).reduce((acc: number, t: any) => t.type === 'deposit' ? acc + t.amount : acc - t.amount, 0) })
    setBalances(sbBalances)
  }

  const logBet = () => {
    if (!results || !event) { alert('Please enter an event name'); return }
    const bets = JSON.parse(localStorage.getItem('gnl_bet_history') || '[]')
    bets.unshift({ id: Date.now(), date: new Date().toISOString().split('T')[0], sport, event, betType, odds1: results.odds1, odds2: results.odds2, stake1: parseFloat(results.stake1), stake2: parseFloat(results.stake2), profit: parseFloat(results.profit), sportsbook1: results.sb1, sportsbook2: results.sb2, status: 'pending' })
    localStorage.setItem('gnl_bet_history', JSON.stringify(bets))
    alert('Bet logged!')
    setShowBetForm(false); setEvent(''); setBetType('Moneyline')
  }

  const maxStake = getMaxStake()

  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-[--border] px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="btn-ghost text-[--text-secondary] hover:text-[--text-primary] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div>
                <h1 className="font-bold text-lg tracking-tight">Arbitrage Calculator</h1>
                <p className="text-[12px] text-[--text-muted]">Calculate optimal stakes for guaranteed profit</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasteWindow(!showPasteWindow)}
              className="btn btn-secondary text-[13px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Paste Slip
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="max-w-5xl mx-auto animate-in">
            {/* Paste Window */}
            {showPasteWindow && (
              <div className="card p-6 mb-6 animate-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Paste Betting Slip</h3>
                  <button onClick={() => { setShowPasteWindow(false); setPasteInput('') }} className="btn-ghost text-[--text-muted]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-[12px] text-[--text-muted] mb-3">Auto-detects: M (BetMGM), R (BetRivers), S (theScore), D (DraftKings)</p>
                {pasteInput && (() => {
                  const parsed = parseBettingSlip(pasteInput)
                  return (
                    <div className="mb-4 p-3 bg-[--bg-input] rounded-lg border border-dashed border-[--border] text-[11px] font-mono text-[--text-muted]">
                      <div className="font-semibold text-[--text-secondary] mb-1">Preview:</div>
                      <div>odds1: {parsed.odds1 || '—'} | odds2: {parsed.odds2 || '—'}</div>
                      <div>sb1: {parsed.sb1 || '—'} | sb2: {parsed.sb2 || '—'}</div>
                      <div>event: {parsed.event || '—'}</div>
                    </div>
                  )
                })()}
                <textarea
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  className="input-field font-mono text-[12px] mb-4"
                  rows={6}
                  placeholder="Paste your betting slip here..."
                />
                <div className="flex gap-3">
                  <button onClick={handlePaste} className="btn btn-primary text-[13px]">Auto-Populate</button>
                  <button onClick={() => { setShowPasteWindow(false); setPasteInput('') }} className="btn btn-secondary text-[13px]">Cancel</button>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left: Input */}
              <div className="lg:col-span-3 space-y-6">
                {/* Odds Section */}
                <div className="card p-6">
                  <h3 className="text-[11px] font-semibold text-[--text-muted] uppercase tracking-wider mb-5">Odds Input</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Side 1 */}
                    <div className="space-y-3">
                      <select value={sportsbook1} onChange={(e) => setSportsbook1(e.target.value)} className="select-field text-[13px]">
                        {sportsbooks.map(sb => <option key={sb} value={sb}>{sb}</option>)}
                      </select>
                      <div className="relative">
                        <input
                          type="number"
                          className="input-field text-center font-mono text-2xl font-bold py-4"
                          placeholder="+150"
                          value={odds1}
                          onChange={(e) => setOdds1(e.target.value)}
                        />
                      </div>
                      {balances[sportsbook1] !== undefined && (
                        <div className="text-center">
                          <span className="text-[11px] text-[--text-muted]">Balance </span>
                          <span className={`text-[12px] font-mono font-semibold ${balances[sportsbook1] >= 0 ? 'text-[--accent]' : 'text-[--danger]'}`}>
                            ${balances[sportsbook1].toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Side 2 */}
                    <div className="space-y-3">
                      <select value={sportsbook2} onChange={(e) => setSportsbook2(e.target.value)} className="select-field text-[13px]">
                        {sportsbooks.map(sb => <option key={sb} value={sb}>{sb}</option>)}
                      </select>
                      <div className="relative">
                        <input
                          type="number"
                          className="input-field text-center font-mono text-2xl font-bold py-4"
                          placeholder="-110"
                          value={odds2}
                          onChange={(e) => setOdds2(e.target.value)}
                        />
                      </div>
                      {balances[sportsbook2] !== undefined && (
                        <div className="text-center">
                          <span className="text-[11px] text-[--text-muted]">Balance </span>
                          <span className={`text-[12px] font-mono font-semibold ${balances[sportsbook2] >= 0 ? 'text-[--accent]' : 'text-[--danger]'}`}>
                            ${balances[sportsbook2].toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stake Section */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold text-[--text-muted] uppercase tracking-wider">Total Stake</h3>
                    {maxStake > 0 && (
                      <button onClick={setMaxStake} className="text-[11px] font-mono text-[--accent] hover:underline">
                        MAX ${maxStake}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[--text-muted] font-mono font-bold">$</span>
                    <input
                      type="number"
                      className="input-field text-center font-mono text-3xl font-bold py-5 pl-8"
                      placeholder="0"
                      value={totalStake}
                      onChange={(e) => setTotalStake(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={calculateArb} className="btn btn-primary flex-1 py-3 text-[15px]">Calculate</button>
                    <button onClick={() => { setOdds1(''); setOdds2(''); setTotalStake(''); setResults(null); setShowBetForm(false) }} className="btn btn-secondary px-6">Clear</button>
                  </div>
                </div>

                {/* Results */}
                {results && (
                  <div className={`card p-6 animate-in ${results.isArb ? 'border-[--accent]/30' : 'border-[--danger]/30'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-3 h-3 rounded-full ${results.isArb ? 'bg-[--accent]' : 'bg-[--danger]'}`}></div>
                      <h3 className={`font-bold text-lg ${results.isArb ? 'text-[--accent]' : 'text-[--danger]'}`}>
                        {results.isArb ? 'Arbitrage Found' : 'No Arbitrage'}
                      </h3>
                      <span className="ml-auto font-mono text-[12px] text-[--text-muted]">
                        {results.isArb ? `${(100 - parseFloat(results.arbPercent)).toFixed(2)}% edge` : `${results.arbPercent}% (need <100%)`}
                      </span>
                    </div>

                    {/* Stakes */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[--bg-input] rounded-lg p-4">
                        <div className="text-[11px] text-[--text-muted] mb-1">{results.sb1}</div>
                        <div className="font-mono text-2xl font-bold">${results.stake1}</div>
                        <div className="text-[11px] text-[--text-muted] mt-1">
                          @ {results.odds1} · bal ${results.balance1.toFixed(2)}
                        </div>
                        {parseFloat(results.stake1) > results.balance1 && (
                          <div className="text-[11px] text-[--danger] mt-1 font-semibold">Insufficient funds</div>
                        )}
                      </div>
                      <div className="bg-[--bg-input] rounded-lg p-4">
                        <div className="text-[11px] text-[--text-muted] mb-1">{results.sb2}</div>
                        <div className="font-mono text-2xl font-bold">${results.stake2}</div>
                        <div className="text-[11px] text-[--text-muted] mt-1">
                          @ {results.odds2} · bal ${results.balance2.toFixed(2)}
                        </div>
                        {parseFloat(results.stake2) > results.balance2 && (
                          <div className="text-[11px] text-[--danger] mt-1 font-semibold">Insufficient funds</div>
                        )}
                      </div>
                    </div>

                    {/* Profit */}
                    <div className="flex items-end justify-between mb-6 p-4 bg-[--bg-input] rounded-lg">
                      <div>
                        <div className="text-[11px] text-[--text-muted] mb-1">Guaranteed Profit</div>
                        <div className="font-mono text-3xl font-bold text-[--accent]">${results.profit}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-[--text-muted] mb-1">ROI</div>
                        <div className="font-mono text-2xl font-bold text-[--accent]">{results.roi}%</div>
                      </div>
                    </div>

                    {results.isArb && (
                      <div className="space-y-3">
                        <button onClick={addToTracker} className="btn btn-primary w-full py-3">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          Add to Tracker
                        </button>
                        <button onClick={() => setShowBetForm(!showBetForm)} className="btn btn-secondary w-full py-3">
                          Log This Bet
                        </button>

                        {showBetForm && (
                          <div className="mt-4 p-5 bg-[--bg-input] rounded-lg border border-[--border] space-y-4 animate-in">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-[--text-muted] mb-1.5">Sport</label>
                                <select value={sport} onChange={(e) => setSport(e.target.value)} className="select-field text-[13px]">
                                  {sports.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] text-[--text-muted] mb-1.5">Bet Type</label>
                                <input type="text" value={betType} onChange={(e) => setBetType(e.target.value)} className="input-field text-[13px]" placeholder="Moneyline" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] text-[--text-muted] mb-1.5">Event</label>
                              <input type="text" value={event} onChange={(e) => setEvent(e.target.value)} className="input-field text-[13px]" placeholder="Lakers vs Celtics" />
                            </div>
                            <div className="flex gap-3">
                              <button onClick={logBet} className="btn btn-primary flex-1 text-[13px]">Save</button>
                              <button onClick={() => setShowBetForm(false)} className="btn btn-secondary text-[13px]">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Quick Info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-5">
                  <h3 className="text-[11px] font-semibold text-[--text-muted] uppercase tracking-wider mb-4">Balances</h3>
                  <div className="space-y-2">
                    {sportsbooks.map(sb => {
                      const bal = balances[sb] || 0
                      return (
                        <div key={sb} className="flex items-center justify-between py-2 border-b border-[--border] last:border-0">
                          <span className="text-[13px] text-[--text-secondary]">{sb}</span>
                          <span className={`font-mono text-[13px] font-semibold ${bal >= 0 ? 'text-[--accent]' : 'text-[--danger]'}`}>
                            ${bal.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="text-[11px] font-semibold text-[--text-muted] uppercase tracking-wider mb-4">Quick Reference</h3>
                  <div className="space-y-3 text-[12px] text-[--text-secondary]">
                    <div className="flex gap-2">
                      <span className="text-[--accent]">→</span>
                      <span>Arb % below 100% = guaranteed profit</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[--accent]">→</span>
                      <span>Positive odds: profit = (stake × odds/100)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[--accent]">→</span>
                      <span>Negative odds: profit = (stake × 100/|odds|)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[--gold]">⚡</span>
                      <span>Higher edge = better opportunity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <footer className="border-t border-[--border] px-6 py-3 mt-auto">
        <span className="text-[10px] text-[--text-muted]/50 font-mono">v1.2.0</span>
      </footer>
    </div>
  )
}
