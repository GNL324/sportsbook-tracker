'use client'

import type { CockpitReadiness, InteractiveLaneState, Sportsbook } from '@/lib/sbb'
import {
  cockpitReadinessLabels,
  interactiveLaneStateLabels,
  sportsbookLabels,
} from '@/lib/sbb'
import { useSbbCockpitState, type IntakeField, type LaneFlagKey } from '@/hooks/useSbbCockpitState'
import type { LaneSessionSnapshot } from '@/lib/sbbSessionStore'

const sportsbooks: Sportsbook[] = ['draftkings', 'betmgm', 'betrivers', 'thescore']
const laneStates: InteractiveLaneState[] = ['reserved', 'attached', 'verifying', 'ready_to_confirm', 'recovering']
const readinessStates: CockpitReadiness[] = ['unknown', 'needs_auth', 'needs_page_recovery', 'verifying', 'ready']
const confidenceLevels = ['low', 'medium', 'high'] as const

function pairTone(status: 'green' | 'yellow' | 'red') {
  if (status === 'green') return 'pill-green'
  if (status === 'red') return 'pill-red'
  return 'pill-gold'
}

export function SbbInteractivePanel() {
  const {
    intake,
    lanes,
    pairReadiness,
    updateIntakeField,
    setLaneSportsbook,
    setLaneState,
    setLaneReadiness,
    setLaneFlag,
    recomputePair,
    resetCockpit,
  } = useSbbCockpitState()

  return (
    <section className="mt-10 grid gap-6 animate-in">
      <div className="sbb-human-banner rounded-[22px] border border-amber-400/35 bg-amber-500/10 px-5 py-4 text-[14px] leading-relaxed text-amber-50">
        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-amber-200/80 mb-2">Human boundary</div>
        <div className="font-semibold text-white">
          Automation stops at Ready to Confirm. Final Place Bet click is human-only.
        </div>
      </div>

      <div className="glass-panel rounded-[24px] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Behavior layer</div>
            <div className="text-white font-bold text-xl mt-1">Interactive cockpit controls</div>
            <p className="text-[14px] text-white/65 mt-2 max-w-2xl">
              Drive lane state, readiness, and session flags locally. Nothing here submits a wager; it only models execution
              posture up to ready-to-confirm.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="sbb-btn-secondary" onClick={() => recomputePair()}>
              Recompute pair
            </button>
            <button type="button" className="sbb-btn-ghost-danger" onClick={() => resetCockpit()}>
              Reset cockpit
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-[20px] p-4 md:p-5 mb-6 border border-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Evaluated pair readiness</div>
              <div className="text-white font-semibold text-lg mt-1">Derived from lane truth + operator blockers</div>
            </div>
            <span className={`pill ${pairTone(pairReadiness.status)}`}>PAIR {pairReadiness.status.toUpperCase()}</span>
          </div>
          <p className="text-[14px] leading-relaxed text-white/72">{pairReadiness.summary}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 mb-8">
          <label className="sbb-field">
            <span className="sbb-label">Event</span>
            <input
              className="sbb-input"
              value={intake.event}
              onChange={(e) => updateIntakeField('event', e.target.value)}
            />
          </label>
          <label className="sbb-field">
            <span className="sbb-label">Market</span>
            <input
              className="sbb-input"
              value={intake.market}
              onChange={(e) => updateIntakeField('market', e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <LegIntakeCard
            title="Lane A intake"
            legKey="legA"
            leg={intake.legA}
            onChange={(field, value) => updateIntakeField(field, value)}
          />
          <LegIntakeCard
            title="Lane B intake"
            legKey="legB"
            leg={intake.legB}
            onChange={(field, value) => updateIntakeField(field, value)}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LaneCard
          laneId="A"
          lane={lanes.A}
          onSportsbookChange={(book) => setLaneSportsbook('A', book)}
          onStateChange={(state) => setLaneState('A', state)}
          onReadinessChange={(r) => setLaneReadiness('A', r)}
          onFlag={setLaneFlag}
        />
        <LaneCard
          laneId="B"
          lane={lanes.B}
          onSportsbookChange={(book) => setLaneSportsbook('B', book)}
          onStateChange={(state) => setLaneState('B', state)}
          onReadinessChange={(r) => setLaneReadiness('B', r)}
          onFlag={setLaneFlag}
        />
      </div>
    </section>
  )
}

function LegIntakeCard({
  title,
  legKey,
  leg,
  onChange,
}: {
  title: string
  legKey: 'legA' | 'legB'
  leg: { sportsbook: Sportsbook; side: string; odds: string }
  onChange: (field: IntakeField, value: string) => void
}) {
  return (
    <div className="glass-panel rounded-[20px] p-4 md:p-5 border border-white/10">
      <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45 mb-4">{title}</div>
      <div className="grid gap-4">
        <label className="sbb-field">
          <span className="sbb-label">Sportsbook</span>
          <select
            className="sbb-select"
            value={leg.sportsbook}
            onChange={(e) => onChange(`${legKey}.sportsbook` as IntakeField, e.target.value)}
          >
            {sportsbooks.map((book) => (
              <option key={book} value={book}>
                {sportsbookLabels[book]}
              </option>
            ))}
          </select>
        </label>
        <label className="sbb-field">
          <span className="sbb-label">Side</span>
          <input className="sbb-input" value={leg.side} onChange={(e) => onChange(`${legKey}.side` as IntakeField, e.target.value)} />
        </label>
        <label className="sbb-field">
          <span className="sbb-label">Odds</span>
          <input className="sbb-input" value={leg.odds} onChange={(e) => onChange(`${legKey}.odds` as IntakeField, e.target.value)} />
        </label>
      </div>
    </div>
  )
}

function LaneCard({
  laneId,
  lane,
  onSportsbookChange,
  onStateChange,
  onReadinessChange,
  onFlag,
}: {
  laneId: 'A' | 'B'
  lane: LaneSessionSnapshot
  onSportsbookChange: (book: Sportsbook) => void
  onStateChange: (state: InteractiveLaneState) => void
  onReadinessChange: (readiness: CockpitReadiness) => void
  onFlag: (laneId: 'A' | 'B', key: LaneFlagKey, value: boolean | string | null) => void
}) {
  return (
    <div className="glass-panel rounded-[24px] p-5 md:p-6 border border-white/10">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/45">Lane {laneId}</div>
          <div className="text-white font-bold text-2xl mt-2">{sportsbookLabels[lane.sportsbook]}</div>
        </div>
        <div className="pill pill-blue">{lane.windowLabel === 'unassigned' ? 'Unassigned' : `Window ${lane.windowLabel}`}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="sbb-field md:col-span-2">
          <span className="sbb-label">Sportsbook</span>
          <select className="sbb-select" value={lane.sportsbook} onChange={(e) => onSportsbookChange(e.target.value as Sportsbook)}>
            {sportsbooks.map((book) => (
              <option key={book} value={book}>
                {sportsbookLabels[book]}
              </option>
            ))}
          </select>
        </label>

        <label className="sbb-field">
          <span className="sbb-label">Lane state</span>
          <select className="sbb-select" value={lane.laneState} onChange={(e) => onStateChange(e.target.value as InteractiveLaneState)}>
            {laneStates.map((state) => (
              <option key={state} value={state}>
                {interactiveLaneStateLabels[state]}
              </option>
            ))}
          </select>
        </label>

        <label className="sbb-field">
          <span className="sbb-label">Readiness</span>
          <select className="sbb-select" value={lane.readiness} onChange={(e) => onReadinessChange(e.target.value as CockpitReadiness)}>
            {readinessStates.map((state) => (
              <option key={state} value={state}>
                {cockpitReadinessLabels[state]}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
          <div className="sbb-toggle-row">
            <span className="sbb-label mb-0">Attached</span>
            <button
              type="button"
              className={`sbb-toggle ${lane.attached ? 'sbb-toggle-on' : ''}`}
              onClick={() => onFlag(laneId, 'attached', !lane.attached)}
              aria-pressed={lane.attached}
            >
              {lane.attached ? 'Yes' : 'No'}
            </button>
          </div>
          <div className="sbb-toggle-row">
            <span className="sbb-label mb-0">Betslip healthy</span>
            <button
              type="button"
              className={`sbb-toggle ${lane.betslipHealthy ? 'sbb-toggle-on' : ''}`}
              onClick={() => onFlag(laneId, 'betslipHealthy', !lane.betslipHealthy)}
              aria-pressed={lane.betslipHealthy}
            >
              {lane.betslipHealthy ? 'Yes' : 'No'}
            </button>
          </div>
        </div>

        <label className="sbb-field">
          <span className="sbb-label">Event confidence</span>
          <select
            className="sbb-select"
            value={lane.eventConfidence}
            onChange={(e) => onFlag(laneId, 'eventConfidence', e.target.value as (typeof confidenceLevels)[number])}
          >
            {confidenceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="sbb-field">
          <span className="sbb-label">Market confidence</span>
          <select
            className="sbb-select"
            value={lane.marketConfidence}
            onChange={(e) => onFlag(laneId, 'marketConfidence', e.target.value as (typeof confidenceLevels)[number])}
          >
            {confidenceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="sbb-field md:col-span-2">
          <span className="sbb-label">Window label</span>
          <select
            className="sbb-select"
            value={lane.windowLabel}
            onChange={(e) => onFlag(laneId, 'windowLabel', e.target.value as 'A' | 'B' | 'unassigned')}
          >
            <option value="A">Window A</option>
            <option value="B">Window B</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>

        <label className="sbb-field md:col-span-2">
          <span className="sbb-label">Operator blocker</span>
          <textarea
            className="sbb-textarea"
            rows={3}
            value={lane.blocker ?? ''}
            onChange={(e) => onFlag(laneId, 'blocker', e.target.value)}
            placeholder="Optional operator note; non-empty text degrades pair status."
          />
        </label>

        <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45">Last verified at</div>
            <div className="text-[13px] text-white/75 font-mono mt-1">{lane.lastVerifiedAt ?? 'Not set'}</div>
          </div>
          <button
            type="button"
            className="sbb-btn-secondary"
            onClick={() => onFlag(laneId, 'lastVerifiedAt', new Date().toISOString())}
          >
            Stamp verification time
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {laneStates.map((state) => (
          <button key={state} type="button" className="sbb-chip" onClick={() => onStateChange(state)}>
            {interactiveLaneStateLabels[state]}
          </button>
        ))}
      </div>
    </div>
  )
}
