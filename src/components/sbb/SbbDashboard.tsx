'use client'

import { demoOpportunity, getPairReadiness, getPairSummary, laneStateLabels, mapOpportunityToLanes, readinessLabels, sportsbookLabels } from '@/lib/sbb'

const lanes = mapOpportunityToLanes(demoOpportunity)
const pairReadiness = getPairReadiness(lanes)
const pairSummary = getPairSummary(lanes)

const pairTone = {
  green: 'badge-green',
  yellow: 'badge-gold',
  red: 'badge-red',
}[pairReadiness]

export function SbbDashboard() {
  return (
    <div className="grid gap-6 animate-in">
      <section className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-[--border] bg-[--bg-card-hover]">
              <span className="w-2 h-2 rounded-full bg-[--accent] animate-pulse"></span>
              <span className="text-[11px] text-[--text-secondary] font-medium tracking-wide uppercase">First implementation slice</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Shared Sportsbook Browser</h1>
            <p className="text-[--text-secondary] max-w-2xl leading-relaxed">
              First executable SBB dashboard for manual opportunity intake, lane mapping, readiness truth, and ready-to-confirm tracking.
            </p>
          </div>
          <div className="card p-4 min-w-[250px] bg-[--bg-card-hover]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[--text-muted] mb-2">Pair readiness</div>
            <div className={`badge ${pairTone} mb-3`}>{pairReadiness.toUpperCase()}</div>
            <p className="text-[13px] text-[--text-secondary] leading-relaxed">{pairSummary}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-lg">Opportunity intake</h2>
              <p className="text-[13px] text-[--text-secondary] mt-1">Manual first-wave intake, aligned to the DK + BetMGM build path.</p>
            </div>
            <span className="text-[11px] text-[--text-muted] font-mono">v0.1.0</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <label className="text-[12px] font-medium text-[--text-secondary] mb-2 block">Event</label>
              <input className="input-field" value={demoOpportunity.event} readOnly />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[--text-secondary] mb-2 block">Market</label>
              <input className="input-field" value={demoOpportunity.market} readOnly />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[demoOpportunity.legA, demoOpportunity.legB].map((leg, index) => (
              <div key={`${leg.sportsbook}-${index}`} className="rounded-xl border border-[--border] bg-[--bg-card-hover] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[--text-muted]">Leg {index === 0 ? 'A' : 'B'}</span>
                  <span className="badge badge-blue">{sportsbookLabels[leg.sportsbook]}</span>
                </div>
                <div className="grid gap-3">
                  <div>
                    <div className="text-[11px] text-[--text-muted] uppercase tracking-wide mb-1">Selection</div>
                    <div className="font-semibold">{leg.side}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[--text-muted] uppercase tracking-wide mb-1">Odds</div>
                    <div className="stat-value text-lg">{leg.odds}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-lg">Execution pair</h2>
              <p className="text-[13px] text-[--text-secondary] mt-1">Lane A / Lane B mapped into one visible window per book.</p>
            </div>
            <span className="badge badge-gold">Dual window</span>
          </div>

          <div className="space-y-4">
            {lanes.map((lane) => (
              <div key={lane.id} className="rounded-xl border border-[--border] p-4 bg-[--bg-card-hover]">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[--text-muted]">Lane {lane.id}</div>
                    <div className="font-bold text-lg mt-1">{lane.sportsbook ? sportsbookLabels[lane.sportsbook] : 'Unassigned'}</div>
                  </div>
                  <div className="text-right">
                    <div className="badge badge-blue mb-2">{lane.windowLabel}</div>
                    <div className="text-[11px] text-[--text-muted] font-mono">{laneStateLabels[lane.state]}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoBlock label="Readiness" value={readinessLabels[lane.readiness]} />
                  <InfoBlock label="Betslip" value={lane.betslipHealthy ? 'Healthy' : 'Needs recovery'} />
                  <InfoBlock label="Event confidence" value={lane.eventConfidence} />
                  <InfoBlock label="Market confidence" value={lane.marketConfidence} />
                </div>

                {lane.blocker ? (
                  <div className="mt-4 rounded-lg bg-[--gold-dim] px-3 py-2 text-[12px] text-[--gold] leading-relaxed">
                    {lane.blocker}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-[--accent-dim] px-3 py-2 text-[12px] text-[--accent] leading-relaxed">
                    Lane is healthy enough to continue into event navigation and verification.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <FeatureCard
          title="Session truth"
          desc="Separate session readiness from execution readiness so open tabs do not get mistaken for trustworthy execution surfaces."
          stat="Ready vs stale vs blocked"
        />
        <FeatureCard
          title="Lane state machine"
          desc="Enforce lane progression from reserved -> attached -> verifying -> ready-to-confirm without invalid jumps."
          stat="Machine-usable flow"
        />
        <FeatureCard
          title="Human boundary"
          desc="Maximum automation up to the final Place Bet click. Ready-to-confirm is the stop line, not submission."
          stat="Human owns final click"
        />
      </section>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-[--text-muted] uppercase tracking-wide mb-1">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function FeatureCard({ title, desc, stat }: { title: string; desc: string; stat: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] text-[--text-muted] font-mono uppercase tracking-widest mb-3">{stat}</div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-[13px] text-[--text-secondary] leading-relaxed">{desc}</p>
    </div>
  )
}
