'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { utils, writeFile, read } from 'xlsx'

interface Bet {
  id: number
  date: string
  sport: string
  event: string
  betType: string
  odds1: string
  odds2: string
  stake1: number
  stake2: number
  profit: number
  sportsbook1: string
  sportsbook2: string
  status: 'pending' | 'won' | 'lost'
}

const sportsbooks = ['DraftKings', 'BetMGM', 'theScore BET', 'BetRivers']
const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Other']

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-[--info]', bg: 'bg-[--info-dim]' },
  won: { label: 'Won', color: 'text-[--accent]', bg: 'bg-[--accent-dim]' },
  lost: { label: 'Lost', color: 'text-[--danger]', bg: 'bg-[--danger-dim]' },
}

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sport, setSport] = useState('NFL')
  const [event, setEvent] = useState('')
  const [betType, setBetType] = useState('')
  const [odds1, setOdds1] = useState('')
  const [odds2, setOdds2] = useState('')
  const [stake1, setStake1] = useState('')
  const [stake2, setStake2] = useState('')
  const [sportsbook1, setSportsbook1] = useState('DraftKings')
  const [sportsbook2, setSportsbook2] = useState('BetMGM')
  const [profit, setProfit] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')

  useEffect(() => {
    const saved = localStorage.getItem('gnl_bet_history')
    if (saved) setBets(JSON.parse(saved))
  }, [])

  const addBet = () => {
    if (!event || !stake1 || !stake2) return
    const newBet: Bet = {
      id: Date.now(), date, sport, event, betType, odds1, odds2,
      stake1: parseFloat(stake1), stake2: parseFloat(stake2),
      profit: parseFloat(profit) || 0, sportsbook1, sportsbook2, status: 'pending'
    }
    const updated = [newBet, ...bets]
    setBets(updated); localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
    setEvent(''); setBetType(''); setOdds1(''); setOdds2(''); setStake1(''); setStake2(''); setProfit(''); setShowForm(false)
  }

  const deleteBet = (id: number) => {
    const updated = bets.filter(b => b.id !== id)
    setBets(updated); localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
  }

  const updateStatus = (id: number, status: 'won' | 'lost') => {
    const updated = bets.map(b => b.id === id ? { ...b, status } : b)
    setBets(updated); localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
  }

  const totalProfit = bets.reduce((acc, b) => acc + (b.status === 'won' ? b.profit : -b.stake1 - b.stake2), 0)
  const wonBets = bets.filter(b => b.status === 'won')
  const lostBets = bets.filter(b => b.status === 'lost')
  const pendingBets = bets.filter(b => b.status === 'pending')
  const winRate = bets.filter(b => b.status !== 'pending').length > 0
    ? ((wonBets.length / (wonBets.length + lostBets.length)) * 100).toFixed(0) : '—'

  const filteredBets = filter === 'all' ? bets : bets.filter(b => b.status === filter)

  const exportToExcel = () => {
    const data = bets.map(b => ({
      Date: b.date, Sport: b.sport, Event: b.event, 'Bet Type': b.betType,
      'Sportsbook 1': b.sportsbook1, 'Odds 1': b.odds1, 'Stake 1': b.stake1,
      'Sportsbook 2': b.sportsbook2, 'Odds 2': b.odds2, 'Stake 2': b.stake2,
      'Profit ($)': b.profit, Status: b.status.charAt(0).toUpperCase() + b.status.slice(1)
    }))
    const ws = utils.json_to_sheet(data); const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Bet History')
    writeFile(wb, `bet-history-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result; const wb = read(bstr, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]; const data = utils.sheet_to_json(ws) as any[]
        const imported = data.map((row: any, index: number) => ({
          id: Date.now() + index, date: row.Date || new Date().toISOString().split('T')[0],
          sport: row.Sport || 'Other', event: row.Event || '', betType: row['Bet Type'] || '',
          odds1: row['Odds 1'] || '', odds2: row['Odds 2'] || '',
          stake1: parseFloat(row['Stake 1']) || 0, stake2: parseFloat(row['Stake 2']) || 0,
          profit: parseFloat(row['Profit ($)']) || 0, sportsbook1: row['Sportsbook 1'] || 'DraftKings',
          sportsbook2: row['Sportsbook 2'] || 'BetMGM',
          status: (row.Status?.toLowerCase() || 'pending') as Bet['status']
        }))
        const updated = [...imported, ...bets]
        setBets(updated); localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
        alert(`Imported ${imported.length} bets!`)
      } catch { alert('Error importing file.') }
    }
    reader.readAsBinaryString(file); e.target.value = ''
  }

  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-[--border] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="btn-ghost text-[--text-secondary] hover:text-[--text-primary] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div>
                <h1 className="font-bold text-lg tracking-tight">Bet History</h1>
                <p className="text-[12px] text-[--text-muted]">Log and track all your arbitrage bets</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToExcel} disabled={bets.length === 0} className="btn btn-secondary text-[12px] disabled:opacity-30">Export</button>
              <label className="btn btn-secondary text-[12px] cursor-pointer">Import<input type="file" accept=".xlsx,.xls" onChange={importFromExcel} className="hidden" /></label>
              <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-[13px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Log Bet
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto animate-in">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              <div className="card p-4 md:col-span-1 col-span-1">
                <div className="text-[11px] text-[--text-muted] mb-1">Total Profit</div>
                <div className={`font-mono text-xl font-bold ${totalProfit >= 0 ? 'text-[--accent]' : 'text-[--danger]'}`}>
                  ${totalProfit.toFixed(2)}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-[11px] text-[--text-muted] mb-1">Win Rate</div>
                <div className="font-mono text-xl font-bold">{winRate}%</div>
              </div>
              <div className="card p-4">
                <div className="text-[11px] text-[--text-muted] mb-1">Won</div>
                <div className="font-mono text-xl font-bold text-[--accent]">{wonBets.length}</div>
              </div>
              <div className="card p-4">
                <div className="text-[11px] text-[--text-muted] mb-1">Lost</div>
                <div className="font-mono text-xl font-bold text-[--danger]">{lostBets.length}</div>
              </div>
              <div className="card p-4">
                <div className="text-[11px] text-[--text-muted] mb-1">Pending</div>
                <div className="font-mono text-xl font-bold text-[--info]">{pendingBets.length}</div>
              </div>
            </div>

            {/* Add Bet Form */}
            {showForm && (
              <div className="card p-6 mb-6 animate-in">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-sm">Log New Bet</h3>
                  <button onClick={() => setShowForm(false)} className="btn-ghost text-[--text-muted]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Event</label>
                    <input type="text" value={event} onChange={(e) => setEvent(e.target.value)} className="input-field" placeholder="Lakers vs Celtics" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Sport</label>
                    <select value={sport} onChange={(e) => setSport(e.target.value)} className="select-field">
                      {sports.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="card-inner p-4 bg-[--bg-input] rounded-lg border border-[--border] space-y-3">
                    <div className="text-[11px] text-[--text-muted] uppercase tracking-wider font-semibold">Side 1</div>
                    <select value={sportsbook1} onChange={(e) => setSportsbook1(e.target.value)} className="select-field text-[13px]">
                      {sportsbooks.map(sb => <option key={sb} value={sb}>{sb}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[--text-muted] mb-1">Odds</label>
                        <input type="text" value={odds1} onChange={(e) => setOdds1(e.target.value)} className="input-field font-mono text-[13px]" placeholder="+150" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[--text-muted] mb-1">Stake $</label>
                        <input type="number" value={stake1} onChange={(e) => setStake1(e.target.value)} className="input-field font-mono text-[13px]" placeholder="50" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-[--bg-input] rounded-lg border border-[--border] space-y-3">
                    <div className="text-[11px] text-[--text-muted] uppercase tracking-wider font-semibold">Side 2</div>
                    <select value={sportsbook2} onChange={(e) => setSportsbook2(e.target.value)} className="select-field text-[13px]">
                      {sportsbooks.map(sb => <option key={sb} value={sb}>{sb}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[--text-muted] mb-1">Odds</label>
                        <input type="text" value={odds2} onChange={(e) => setOdds2(e.target.value)} className="input-field font-mono text-[13px]" placeholder="-110" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[--text-muted] mb-1">Stake $</label>
                        <input type="number" value={stake2} onChange={(e) => setStake2(e.target.value)} className="input-field font-mono text-[13px]" placeholder="50" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Expected Profit ($)</label>
                    <input type="number" value={profit} onChange={(e) => setProfit(e.target.value)} className="input-field font-mono" placeholder="5.00" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Bet Type</label>
                    <input type="text" value={betType} onChange={(e) => setBetType(e.target.value)} className="input-field" placeholder="Moneyline, Spread" />
                  </div>
                </div>
                <button onClick={addBet} className="btn btn-primary w-full py-3">Log Bet</button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-1 mb-4 p-1 bg-[--bg-card] rounded-lg border border-[--border] w-fit">
              {(['all', 'pending', 'won', 'lost'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-md text-[12px] font-medium transition-all ${
                    filter === f
                      ? 'bg-[--accent] text-black'
                      : 'text-[--text-secondary] hover:text-[--text-primary]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${bets.length})` : `(${bets.filter(b => b.status === f).length})`}
                </button>
              ))}
            </div>

            {/* Bet List */}
            <div className="card">
              {filteredBets.length === 0 ? (
                <div className="p-12 text-center text-[--text-muted] text-[14px]">No bets {filter !== 'all' ? `with status "${filter}"` : 'logged yet'}</div>
              ) : (
                <div className="divide-y divide-[--border]">
                  {filteredBets.map(bet => {
                    const sc = statusConfig[bet.status]
                    return (
                      <div key={bet.id} className="px-6 py-4 hover:bg-[--bg-card-hover] transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold">{bet.event}</span>
                              <span className={`badge ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            </div>
                            <div className="text-[11px] text-[--text-muted] mt-0.5">
                              {bet.date} · {bet.sport}{bet.betType ? ` · ${bet.betType}` : ''}
                            </div>
                          </div>
                          <div className="font-mono text-[14px] font-semibold">
                            <span className={bet.status === 'won' ? 'text-[--accent]' : bet.status === 'lost' ? 'text-[--danger]' : 'text-[--text-secondary]'}>
                              {bet.status === 'won' ? '+' : bet.status === 'lost' ? '-' : ''}$
                              {bet.status === 'won' ? bet.profit.toFixed(2) : bet.status === 'lost' ? (bet.stake1 + bet.stake2).toFixed(2) : bet.profit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-[--text-muted] font-mono">
                            {bet.sportsbook1} ({bet.odds1}) ${bet.stake1} · {bet.sportsbook2} ({bet.odds2}) ${bet.stake2}
                          </div>
                          <div className="flex items-center gap-1">
                            {bet.status === 'pending' && (
                              <>
                                <button onClick={() => updateStatus(bet.id, 'won')} className="btn-ghost text-[11px] text-[--accent] font-semibold px-2 py-1">Won</button>
                                <button onClick={() => updateStatus(bet.id, 'lost')} className="btn-ghost text-[11px] text-[--danger] font-semibold px-2 py-1">Lost</button>
                              </>
                            )}
                            <button onClick={() => deleteBet(bet.id)} className="btn-ghost text-[--text-muted] opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <footer className="border-t border-[--border] px-6 py-3">
        <span className="text-[10px] text-[--text-muted]/50 font-mono">v1.2.0</span>
      </footer>
    </div>
  )
}
