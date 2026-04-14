'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { utils, writeFile, read } from 'xlsx'

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

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  deposit: { label: 'Deposit', icon: '↓', color: 'text-[--accent]' },
  withdrawal: { label: 'Withdrawal', icon: '↑', color: 'text-[--danger]' },
  transfer: { label: 'Transfer', icon: '⇄', color: 'text-[--info]' },
  paypal: { label: 'PayPal', icon: '◆', color: 'text-[--gold]' },
}

export default function TrackerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [type, setType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'paypal'>('deposit')
  const [amount, setAmount] = useState('')
  const [sportsbook, setSportsbook] = useState('DraftKings')
  const [fromSportsbook, setFromSportsbook] = useState('DraftKings')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gnl_tracker_transactions')
    if (saved) setTransactions(JSON.parse(saved))
  }, [])

  const addTransaction = () => {
    if (!amount) return
    const newTx: Transaction = {
      id: Date.now(), type, amount: parseFloat(amount),
      sportsbook, fromSportsbook: type === 'transfer' ? fromSportsbook : undefined,
      date, notes
    }
    const updated = [newTx, ...transactions]
    setTransactions(updated)
    localStorage.setItem('gnl_tracker_transactions', JSON.stringify(updated))
    setAmount(''); setNotes(''); setShowForm(false)
  }

  const deleteTransaction = (id: number) => {
    const updated = transactions.filter(t => t.id !== id)
    setTransactions(updated)
    localStorage.setItem('gnl_tracker_transactions', JSON.stringify(updated))
  }

  const getBalance = (sb: string) => {
    return transactions
      .filter(t => t.type === 'transfer' ? (t.sportsbook === sb || t.fromSportsbook === sb) : t.sportsbook === sb)
      .reduce((acc, t) => {
        if (t.type === 'transfer') {
          if (t.sportsbook === sb) return acc + t.amount
          if (t.fromSportsbook === sb) return acc - t.amount
        }
        if (t.type === 'paypal') return t.sportsbook === sb ? acc + t.amount : acc
        return t.type === 'deposit' ? acc + t.amount : acc - t.amount
      }, 0)
  }

  const paypalBalance = transactions.filter(t => t.type === 'paypal').reduce((acc, t) => acc + t.amount, 0)
  const sportsbookBalances = sportsbooks.filter(sb => sb !== 'PayPal').reduce((acc, sb) => { acc[sb] = getBalance(sb); return acc }, {} as Record<string, number>)
  const totalBalance = Object.values(sportsbookBalances).reduce((a, b) => a + b, 0) + paypalBalance

  const exportToExcel = () => {
    const data = transactions.map(t => ({ Date: t.date, Type: t.type.charAt(0).toUpperCase() + t.type.slice(1), Amount: t.amount, Sportsbook: t.sportsbook, From: t.fromSportsbook || '', Notes: t.notes }))
    const ws = utils.json_to_sheet(data); const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Transactions')
    writeFile(wb, `bankroll-tracker-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result; const wb = read(bstr, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]; const data = utils.sheet_to_json(ws) as any[]
        const imported = data.map((row: any, index: number) => ({
          id: Date.now() + index, type: (row.Type?.toLowerCase() || 'deposit') as Transaction['type'],
          amount: parseFloat(row.Amount) || 0, sportsbook: row.Sportsbook || 'DraftKings',
          fromSportsbook: row.From || undefined, date: row.Date || new Date().toISOString().split('T')[0], notes: row.Notes || ''
        }))
        const updated = [...imported, ...transactions]
        setTransactions(updated); localStorage.setItem('gnl_tracker_transactions', JSON.stringify(updated))
        alert(`Imported ${imported.length} transactions!`)
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
                <h1 className="font-bold text-lg tracking-tight">Bankroll Tracker</h1>
                <p className="text-[12px] text-[--text-muted]">Track deposits, withdrawals, and balances</p>
              </div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-[13px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Transaction
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto animate-in">
            {/* Balance Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => {
                const bal = sportsbookBalances[sb] || 0
                return (
                  <div key={sb} className="card p-4">
                    <div className="text-[11px] text-[--text-muted] mb-1">{sb}</div>
                    <div className={`font-mono text-lg font-bold ${bal >= 0 ? 'text-[--accent]' : 'text-[--danger]'}`}>
                      ${bal.toFixed(2)}
                    </div>
                  </div>
                )
              })}
              <div className="card p-4 border-[--gold]/20">
                <div className="text-[11px] text-[--text-muted] mb-1">PayPal</div>
                <div className="font-mono text-lg font-bold text-[--gold]">${paypalBalance.toFixed(2)}</div>
              </div>
            </div>

            {/* Total */}
            <div className="card p-5 mb-8 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[--text-muted] uppercase tracking-wider mb-1">Total Bankroll</div>
                <div className={`font-mono text-3xl font-bold ${totalBalance >= 0 ? 'text-[--accent]' : 'text-[--danger]'}`}>
                  ${totalBalance.toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={exportToExcel} disabled={transactions.length === 0} className="btn btn-secondary text-[12px] disabled:opacity-30">
                  Export
                </button>
                <label className="btn btn-secondary text-[12px] cursor-pointer">
                  Import
                  <input type="file" accept=".xlsx,.xls" onChange={importFromExcel} className="hidden" />
                </label>
              </div>
            </div>

            {/* Add Transaction Form */}
            {showForm && (
              <div className="card p-6 mb-6 animate-in">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-sm">New Transaction</h3>
                  <button onClick={() => setShowForm(false)} className="btn-ghost text-[--text-muted]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Type selector */}
                <div className="flex gap-2 mb-5">
                  {(['deposit', 'withdrawal', 'transfer', 'paypal'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        type === t
                          ? 'bg-[--accent] text-black'
                          : 'bg-[--bg-input] text-[--text-secondary] border border-[--border] hover:border-[--border-focus]'
                      }`}
                    >
                      {typeConfig[t].icon} {typeConfig[t].label}
                    </button>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Amount ($)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field font-mono text-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
                  </div>
                </div>

                {type === 'transfer' ? (
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] text-[--text-muted] mb-1.5">From</label>
                      <select value={fromSportsbook} onChange={(e) => setFromSportsbook(e.target.value)} className="select-field">
                        {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => <option key={sb} value={sb}>{sb}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[--text-muted] mb-1.5">To</label>
                      <select value={sportsbook} onChange={(e) => setSportsbook(e.target.value)} className="select-field">
                        {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => <option key={sb} value={sb}>{sb}</option>)}
                      </select>
                    </div>
                  </div>
                ) : type === 'paypal' ? (
                  <div className="mb-4">
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">From Sportsbook</label>
                    <select value={fromSportsbook} onChange={(e) => setFromSportsbook(e.target.value)} className="select-field">
                      {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => <option key={sb} value={sb}>{sb}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Sportsbook</label>
                    <select value={sportsbook} onChange={(e) => setSportsbook(e.target.value)} className="select-field">
                      {sportsbooks.filter(sb => sb !== 'PayPal').map(sb => <option key={sb} value={sb}>{sb}</option>)}
                    </select>
                  </div>
                )}

                {type !== 'paypal' && (
                  <div className="mb-4">
                    <label className="block text-[11px] text-[--text-muted] mb-1.5">Notes</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Optional" />
                  </div>
                )}

                <button onClick={addTransaction} className="btn btn-primary w-full py-3">Add Transaction</button>
              </div>
            )}

            {/* Transaction History */}
            <div className="card">
              <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
                <h3 className="font-semibold text-sm">Transaction History</h3>
                <span className="text-[11px] font-mono text-[--text-muted]">{transactions.length} records</span>
              </div>
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-[--text-muted] text-[14px]">No transactions yet</div>
              ) : (
                <div className="divide-y divide-[--border]">
                  {transactions.map(t => {
                    const cfg = typeConfig[t.type]
                    return (
                      <div key={t.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[--bg-card-hover] transition-colors group">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          t.type === 'deposit' ? 'bg-[--accent-dim] text-[--accent]' :
                          t.type === 'withdrawal' ? 'bg-[--danger-dim] text-[--danger]' :
                          t.type === 'transfer' ? 'bg-[--info-dim] text-[--info]' :
                          'bg-[--gold-dim] text-[--gold]'
                        }`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium">{cfg.label}</span>
                            {t.type === 'transfer' && (
                              <span className="text-[12px] text-[--text-muted]">{t.fromSportsbook} → {t.sportsbook}</span>
                            )}
                            {t.type === 'paypal' && (
                              <span className="text-[12px] text-[--text-muted]">from {t.fromSportsbook}</span>
                            )}
                            {(t.type === 'deposit' || t.type === 'withdrawal') && (
                              <span className="text-[12px] text-[--text-muted]">at {t.sportsbook}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[--text-muted] mt-0.5">
                            {t.date}{t.notes && ` · ${t.notes}`}
                          </div>
                        </div>
                        <div className="font-mono text-[14px] font-semibold text-right">
                          <span className={t.type === 'deposit' || (t.type === 'transfer' && false) ? 'text-[--accent]' : t.type === 'withdrawal' ? 'text-[--danger]' : 'text-[--info]'}>
                            ${t.amount.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="btn-ghost text-[--text-muted] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
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
