'use client'

import { useState, useEffect } from 'react'

interface Position {
  symbol: string
  qty: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
}

interface Trade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  price: number
  timestamp: string
  pnl?: number
}

interface SystemStatus {
  status: 'online' | 'offline' | 'error'
  lastHeartbeat: string
  tradesToday: number
  totalPnl: number
  winRate: number
}

export default function NoelleQuantPage() {
  const [status, setStatus] = useState<SystemStatus>({
    status: 'online',
    lastHeartbeat: new Date().toISOString(),
    tradesToday: 0,
    totalPnl: 0,
    winRate: 0,
  })

  const [positions, setPositions] = useState<Position[]>([
    { symbol: 'AAPL', qty: 100, avgPrice: 185.5, currentPrice: 189.25, pnl: 375, pnlPercent: 2.02 },
    { symbol: 'TSLA', qty: -50, avgPrice: 242.0, currentPrice: 238.5, pnl: 175, pnlPercent: 1.45 },
  ])

  const [trades, setTrades] = useState<Trade[]>([
    { id: '1', symbol: 'AAPL', side: 'buy', qty: 100, price: 185.5, timestamp: '2025-01-18T09:30:00Z' },
    { id: '2', symbol: 'TSLA', side: 'sell', qty: 50, price: 242.0, timestamp: '2025-01-18T10:15:00Z' },
  ])

  const [logs, setLogs] = useState<string[]>([
    '[09:30:00] Signal detected: AAPL bullish momentum',
    '[09:30:05] Executed: BUY 100 AAPL @ $185.50',
    '[10:15:00] Signal detected: TSLA bearish reversal',
    '[10:15:03] Executed: SELL 50 TSLA @ $242.00',
    '[11:00:00] Position update: AAPL +2.02%, TSLA +1.45%',
  ])

  // Auto-refresh simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        lastHeartbeat: new Date().toISOString(),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0)

  return (
    <div className="sbb-shell min-h-screen">
      <div className="mx-auto max-w-[1600px] flex flex-col px-5 py-5 md:px-8 md:py-8">
        {/* Header */}
        <header className="glass-panel mb-6 rounded-[26px] px-6 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 text-lg font-black text-slate-950 shadow-[0_10px_30px_rgba(139,92,246,0.28)]">
                NQ
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.26em] text-white/45">ClawStreet Trading Bot</div>
                <div className="text-2xl font-black tracking-tight text-white mt-1">Noelle Quant LIVE</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`pill ${status.status === 'online' ? 'pill-green' : status.status === 'error' ? 'pill-red' : 'pill-gold'}`}>
                {status.status.toUpperCase()}
              </span>
              <span className="pill pill-blue">Paper Trading</span>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/38">v0.1.0-alpha</span>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard label="Total P&L" value={`$${totalPnl.toFixed(2)}`} tone={totalPnl >= 0 ? 'green' : 'red'} />
          <MetricCard label="Trades Today" value={status.tradesToday.toString()} tone="blue" />
          <MetricCard label="Win Rate" value={`${status.winRate}%`} tone="gold" />
          <MetricCard label="Last Heartbeat" value={new Date(status.lastHeartbeat).toLocaleTimeString()} tone="blue" />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Positions Panel */}
          <div className="glass-panel rounded-[24px] p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Current Positions</div>
                <div className="text-white font-bold text-xl mt-1">Active Holdings</div>
              </div>
              <div className="pill pill-blue">LIVE</div>
            </div>

            <div className="space-y-3">
              {positions.map((pos) => (
                <PositionRow key={pos.symbol} position={pos} />
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45">Total Exposure</span>
                <span className="text-white font-bold">${positions.reduce((s, p) => s + Math.abs(p.qty * p.currentPrice), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Recent Trades Panel */}
          <div className="glass-panel rounded-[24px] p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Execution History</div>
                <div className="text-white font-bold text-xl mt-1">Recent Trades</div>
              </div>
              <div className="pill pill-green">{trades.length} Today</div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {trades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </div>
          </div>

          {/* System Log */}
          <div className="glass-panel rounded-[24px] p-5 md:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Live Stream</div>
                <div className="text-white font-bold text-xl mt-1">System Log</div>
              </div>
              <button className="sbb-btn-secondary text-xs">Clear</button>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 font-mono text-[13px] leading-relaxed text-white/70 space-y-1 max-h-[300px] overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="hover:text-white/90 transition-colors">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <span className="text-[11px] font-mono text-white/38">Noelle Quant • ClawStreet Trading Division • CDP Port 9223</span>
        </footer>
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'blue' | 'gold' }) {
  const toneClass = {
    green: 'text-emerald-300',
    red: 'text-rose-300',
    blue: 'text-sky-300',
    gold: 'text-amber-300',
  }[tone]

  return (
    <div className="glass-panel rounded-[20px] px-4 py-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}

function PositionRow({ position }: { position: Position }) {
  const isLong = position.qty > 0
  
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg">{position.symbol}</span>
          <span className={`text-[11px] px-2 py-1 rounded-full ${isLong ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {isLong ? 'LONG' : 'SHORT'}
          </span>
        </div>
        <span className={`font-mono font-bold ${position.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
        </span>
      </div>
      <div className="flex justify-between text-[13px] text-white/60">
        <span>Qty: {Math.abs(position.qty)} @ ${position.avgPrice.toFixed(2)}</span>
        <span>Mark: ${position.currentPrice.toFixed(2)}</span>
      </div>
    </div>
  )
}

function TradeRow({ trade }: { trade: Trade }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`text-[11px] font-bold px-2 py-1 rounded ${trade.side === 'buy' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
          {trade.side.toUpperCase()}
        </span>
        <span className="text-white font-medium">{trade.symbol}</span>
        <span className="text-white/60 text-sm">{trade.qty} @ ${trade.price.toFixed(2)}</span>
      </div>
      <span className="text-[11px] text-white/40 font-mono">
        {new Date(trade.timestamp).toLocaleTimeString()}
      </span>
    </div>
  )
}
