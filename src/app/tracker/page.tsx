'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { utils, writeFile, read, readFile } from 'xlsx'

interface Transaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'transfer' | 'paypal'
  amount: number
  sportsbook: string
  fromSportsbook?: string
  date: string
  notes: string
}

const sportsbooks = ['DraftKings', 'BetMGM', 'theScore BET', 'BetRivers', 'PayPal']

export default function TrackerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [type, setType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'paypal'>('deposit')
  const [amount, setAmount] = useState('')
  const [sportsbook, setSportsbook] = useState('DraftKings')
  const [fromSportsbook, setFromSportsbook] = useState('DraftKings')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('gnl_tracker_transactions')
    if (saved) setTransactions(JSON.parse(saved))
  }, [])

  const addTransaction = () => {
    if (!amount) return
    const newTx: Transaction = {
      id: Date.now(),
      type,
      amount: parseFloat(amount),
      sportsbook,
      fromSportsbook: type === 'transfer' ? fromSportsbook : undefined,
      date,
      notes
    }
    const updated = [newTx, ...transactions]
    setTransactions(updated)
    localStorage.setItem('gnl_tracker_transactions', JSON.stringify(updated))
    setAmount('')
    setNotes('')
  }

  const deleteTransaction = (id: number) => {
    const updated = transactions.filter(t => t.id !== id)
    setTransactions(updated)
    localStorage.setItem('gnl_tracker_transactions', JSON.stringify(updated))
  }

  const getBalance = (sb: string) => {
    return transactions
      .filter(t => {
        if (t.type === 'transfer') {
          return t.sportsbook === sb || t.fromSportsbook === sb
        }
        return t.sportsbook === sb
      })
      .reduce((acc, t) => {
        if (t.type === 'transfer') {
          if (t.sportsbook === sb) return acc + t.amount
          if (t.fromSportsbook === sb) return acc - t.amount
        }
        if (t.type === 'paypal') {
          if (t.sportsbook === sb) return acc + t.amount
          return acc
        }
        return t.type === 'deposit' ? acc + t.amount : acc - t.amount
      }, 0)
  }

  const paypalBalance = transactions
    .filter(t => t.type === 'paypal')
    .reduce((acc, t) => t.type === 'deposit' ? acc + t.amount : acc - t.amount, 0)

  const sportsbookBalances = sportsbooks
    .filter(sb => sb !== 'PayPal')
    .reduce((acc, sb) => {
      acc[sb] = getBalance(sb)
      return acc
    }, {} as {[key: string]: number})

  const totalBalance = Object.values(sportsbookBalances).reduce((a, b) => a + b, 0) + paypalBalance

  const exportToExcel = () => {
    const data = transactions.map(t => ({
      Date: t.date,
      Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      Amount: t.amount,
      Sportsbook: t.sportsbook,
      From: t.fromSportsbook || '',
      Notes: t.notes
    }))

    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Transactions')
    writeFile(wb, `bankroll-tracker-${new Date().toISOString().split('T')[0]}.xlsx`)
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
          type: (row.Type?.toLowerCase() || 'deposit') as 'deposit' | 'withdrawal' | 'transfer' | 'paypal',
          amount: parseFloat(row.Amount) || 0,
          sportsbook: row.Sportsbook || 'DraftKings',
          fromSportsbook: row.From || undefined,
          date: row.Date || new Date().toISOString().split('T')[0],
          notes: row.Notes || ''
        }))

        const updated = [...imported, ...transactions]
        setTransactions(updated)
        localStorage.setItem('gnl_tracker_transactions', JSON.stringify(updated))
        alert(`✅ Imported ${imported.length} transactions!`)
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

        <h1 className="text-3xl font-bold text-[#00d9ff] mb-2">💰 Bankroll Tracker</h1>
        <p className="text-gray-400 mb-8">Track deposits, withdrawals, transfers, and PayPal</p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-[#00d9ff] mb-4">Add Transaction</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 mb-2">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'deposit' | 'withdrawal' | 'transfer' | 'paypal')}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                  >
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="transfer">Transfer Between Sportsbooks</option>
                    <option value="paypal">PayPal Hold/Release</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    placeholder="100"
                  />
                </div>
              </div>

              {type === 'transfer' ? (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 mb-2">From</label>
                    <select
                      value={fromSportsbook}
                      onChange={(e) => setFromSportsbook(e.target.value)}
                      className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    >
                      {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => (
                        <option key={sb} value={sb}>{sb}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">To</label>
                    <select
                      value={sportsbook}
                      onChange={(e) => setSportsbook(e.target.value)}
                      className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    >
                      {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => (
                        <option key={sb} value={sb}>{sb}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : type === 'paypal' ? (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Action</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'paypal')}
                      className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    >
                      <option value="paypal">Money to PayPal (Hold)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">From Sportsbook</label>
                    <select
                      value={fromSportsbook}
                      onChange={(e) => setFromSportsbook(e.target.value)}
                      className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    >
                      {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => (
                        <option key={sb} value={sb}>{sb}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Sportsbook</label>
                    <select
                      value={sportsbook}
                      onChange={(e) => setSportsbook(e.target.value)}
                      className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    >
                      {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => (
                        <option key={sb} value={sb}>{sb}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              {type !== 'paypal' && (
                <div className="mb-4">
                  <label className="block text-gray-400 mb-2">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-[#00d9ff]/30 rounded-lg text-white"
                    placeholder="Optional notes"
                  />
                </div>
              )}

              <button
                onClick={addTransaction}
                className="w-full py-3 bg-gradient-to-r from-[#00d9ff] to-[#00ff88] text-black font-bold rounded-lg"
              >
                Add Transaction
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={exportToExcel}
                disabled={transactions.length === 0}
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
              <h2 className="text-xl font-bold text-[#00d9ff] mb-4">Transaction History</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                      <div>
                        <div className="font-bold">
                          {t.type === 'transfer' ? (
                            <span className="text-[#00d9ff]">
                              🔄 Transfer ${t.amount}
                            </span>
                          ) : t.type === 'paypal' ? (
                            <span className="text-[#ffa502]">
                              💳 PayPal ${t.amount}
                            </span>
                          ) : (
                            <span className={t.type === 'deposit' ? 'text-[#00ff88]' : 'text-[#ff4757]'}>
                              {t.type === 'deposit' ? '+' : '-'}${t.amount}
                            </span>
                          )}
                          {t.type === 'transfer' ? (
                            <span className="text-gray-400"> {t.fromSportsbook} → {t.sportsbook}</span>
                          ) : t.type === 'paypal' ? (
                            <span className="text-gray-400"> from {t.fromSportsbook}</span>
                          ) : (
                            <span className="text-gray-400"> at {t.sportsbook}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">{t.date} {t.notes && `• ${t.notes}`}</div>
                      </div>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="p-2 hover:bg-red-500/20 rounded text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-black/30 backdrop-blur border border-[#00d9ff]/30 rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-bold text-[#00d9ff] mb-4">Current Balances</h2>
              
              <div className="p-4 bg-[#ffa502]/10 border border-[#ffa502]/30 rounded-lg mb-4">
                <div className="text-gray-400 text-sm">PayPal (Holding)</div>
                <div className="text-2xl font-bold text-[#ffa502]">${paypalBalance.toFixed(2)}</div>
              </div>

              <div className="text-3xl font-bold text-[#00ff88] mb-6">
                Total: ${totalBalance.toFixed(2)}
              </div>

              <div className="space-y-3">
                {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => {
                  const balance = sportsbookBalances[sb] || 0
                  return (
                    <div key={sb} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400">{sb}</span>
                      <span className={`font-bold ${balance >= 0 ? 'text-[#00ff88]' : 'text-[#ff4757]'}`}>
                        ${balance.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
