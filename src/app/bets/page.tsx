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

  useEffect(() => {
    const saved = localStorage.getItem('gnl_bet_history')
    if (saved) setBets(JSON.parse(saved))
  }, [])

  const addBet = () => {
    if (!event || !stake1 || !stake2) return
    const newBet: Bet = {
      id: Date.now(),
      date,
      sport,
      event,
      betType,
      odds1,
      odds2,
      stake1: parseFloat(stake1),
      stake2: parseFloat(stake2),
      profit: parseFloat(profit) || 0,
      sportsbook1,
      sportsbook2,
      status: 'pending'
    }
    const updated = [newBet, ...bets]
    setBets(updated)
    localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
    setEvent('')
    setBetType('')
    setOdds1('')
    setOdds2('')
    setStake1('')
    setStake2('')
    setProfit('')
  }

  const deleteBet = (id: number) => {
    const updated = bets.filter(b => b.id !== id)
    setBets(updated)
    localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
  }

  const updateStatus = (id: number, status: 'won' | 'lost') => {
    const updated = bets.map(b => b.id === id ? { ...b, status } : b)
    setBets(updated)
    localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
  }

  const totalProfit = bets.reduce((acc, b) => acc + (b.status === 'won' ? b.profit : -b.stake1 - b.stake2), 0)
  const pendingBets = bets.filter(b => b.status === 'pending').length

  const exportToExcel = () => {
    const data = bets.map(b => ({
      Date: b.date,
      Sport: b.sport,
      Event: b.event,
      'Bet Type': b.betType,
      'Sportsbook 1': b.sportsbook1,
      'Odds 1': b.odds1,
      'Stake 1': b.stake1,
      'Sportsbook 2': b.sportsbook2,
      'Odds 2': b.odds2,
      'Stake 2': b.stake2,
      'Profit ($)': b.profit,
      Status: b.status.charAt(0).toUpperCase() + b.status.slice(1)
    }))

    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Bet History')
    writeFile(wb, `bet-history-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = utils.sheet_to_json(ws) as any[]

        const imported = data.map((row: any, index: number) => ({
          id: Date.now() + index,
          date: row.Date || new Date().toISOString().split('T')[0],
          sport: row.Sport || 'Other',
          event: row.Event || '',
          betType: row['Bet Type'] || '',
          odds1: row['Odds 1'] || '',
          odds2: row['Odds 2'] || '',
          stake1: parseFloat(row['Stake 1']) || 0,
          stake2: parseFloat(row['Stake 2']) || 0,
          profit: parseFloat(row['Profit ($)']) || 0,
          sportsbook1: row['Sportsbook 1'] || 'DraftKings',
          sportsbook2: row['Sportsbook 2'] || 'BetMGM',
          status: (row.Status?.toLowerCase() || 'pending') as 'pending' | 'won' | 'lost'
        }))

        const updated = [...imported, ...bets]
        setBets(updated)
        localStorage.setItem('gnl_bet_history', JSON.stringify(updated))
        alert(`✅ Imported ${imported.length} bets!`)
      } catch (err) {
        alert('❌ Error importing file. Please check the format.')
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-[#00d9ff] hover:underline">← Back to Home</Link>
        </div>

        <h1 className="text-3xl font-bold text-[#00d9ff] mb-2">📊 Bet History</h1>
        <p className="text-gray-400 mb-8">Log and track all your arbitrage bets</p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-[#00d9ff] mb-4">Log New Bet</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                  >
                    {sports.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Event</label>
                <input
                  type="text"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                  placeholder="e.g., Lakers vs Celtics"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 mb-2">Sportsbook 1</label>
                  <select
                    value={sportsbook1}
                    onChange={(e) => setSportsbook1(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                  >
                    {sportsbooks.map(sb => <option key={sb} value={sb}>{sb}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Odds 1</label>
                  <input
                    type="text"
                    value={odds1}
                    onChange={(e) => setOdds1(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    placeholder="+150"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 mb-2">Sportsbook 2</label>
                  <select
                    value={sportsbook2}
                    onChange={(e) => setSportsbook2(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                  >
                    {sportsbooks.map(sb => <option key={sb} value={sb}>{sb}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Odds 2</label>
                  <input
                    type="text"
                    value={odds2}
                    onChange={(e) => setOdds2(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    placeholder="-110"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 mb-2">Stake 1 ($)</label>
                  <input
                    type="number"
                    value={stake1}
                    onChange={(e) => setStake1(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Stake 2 ($)</label>
                  <input
                    type="number"
                    value={stake2}
                    onChange={(e) => setStake2(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Profit ($)</label>
                  <input
                    type="number"
                    value={profit}
                    onChange={(e) => setProfit(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    placeholder="5"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Bet Type</label>
                <input
                  type="text"
                  value={betType}
                  onChange={(e) => setBetType(e.target.value)}
                  className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                  placeholder="e.g., Moneyline, Spread"
                />
              </div>
              <button
                onClick={addBet}
                className="w-full py-3 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-lg"
              >
                Log Bet
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={exportToExcel}
                disabled={bets.length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
              >
                📥 Export to Excel
              </button>
              <label className="flex-1 py-3 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-lg hover:scale-105 transition-all cursor-pointer text-center">
                📤 Import from Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={importFromExcel}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-[#00d9ff] mb-4">Bet History</h2>
              {bets.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No bets logged yet</p>
              ) : (
                <div className="space-y-3">
                  {bets.map(bet => (
                    <div key={bet.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold">{bet.event}</div>
                          <div className="text-sm text-gray-400">{bet.date} • {bet.sport} • {bet.betType}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          bet.status === 'won' ? 'bg-[#00ff88]/20 text-[#00ff88]' :
                          bet.status === 'lost' ? 'bg-[#ff4757]/20 text-[#ff4757]' :
                          'bg-[#00d9ff]/20 text-[#00d9ff]'
                        }`}>
                          {bet.status.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {bet.sportsbook1} ({bet.odds1}): ${bet.stake1} | {bet.sportsbook2} ({bet.odds2}): ${bet.stake2}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className={`font-bold ${bet.status === 'won' ? 'text-[#00ff88]' : 'text-[#ff4757]'}`}>
                          {bet.status === 'won' ? '+' : '-'}${bet.status === 'won' ? bet.profit : (bet.stake1 + bet.stake2)}
                        </div>
                        {bet.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(bet.id, 'won')}
                              className="px-3 py-1 bg-[#00ff88]/20 text-[#00ff88] rounded hover:bg-[#00ff88]/30 text-sm"
                            >
                              Won
                            </button>
                            <button
                              onClick={() => updateStatus(bet.id, 'lost')}
                              className="px-3 py-1 bg-[#ff4757]/20 text-[#ff4757] rounded hover:bg-[#ff4757]/30 text-sm"
                            >
                              Lost
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => deleteBet(bet.id)}
                          className="p-2 hover:bg-red-500/20 rounded text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-bold text-[#00d9ff] mb-4">Summary</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm">Total Profit</div>
                  <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-[#00ff88]' : 'text-[#ff4757]'}`}>
                    ${totalProfit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Total Bets</div>
                  <div className="text-2xl font-bold">{bets.length}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Pending</div>
                  <div className="text-2xl font-bold text-[#00d9ff]">{pendingBets}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Won</div>
                  <div className="text-2xl font-bold text-[#00ff88]">{bets.filter(b => b.status === 'won').length}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Lost</div>
                  <div className="text-2xl font-bold text-[#ff4757]">{bets.filter(b => b.status === 'lost').length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
