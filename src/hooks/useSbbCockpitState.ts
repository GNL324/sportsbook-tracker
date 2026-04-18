'use client'

import { useCallback, useEffect, useState } from 'react'

import type { CockpitReadiness, ConfidenceLevel, InteractiveLaneState, Sportsbook } from '@/lib/sbb'
import { demoOpportunity, isValidInteractiveLaneTransition } from '@/lib/sbb'
import { evaluatePairReadiness, type PairReadinessResult } from '@/lib/sbbReadiness'
import {
  buildDefaultSessionState,
  loadCockpitState,
  clearPersistedSession,
  saveSessionState,
  type BookSessionState,
  type LaneSessionSnapshot,
  type SbbSessionStateV1,
} from '@/lib/sbbSessionStore'

export type IntakeField =
  | 'event'
  | 'market'
  | 'legA.side'
  | 'legA.odds'
  | 'legA.sportsbook'
  | 'legB.side'
  | 'legB.odds'
  | 'legB.sportsbook'

export type LaneFlagKey =
  | 'attached'
  | 'betslipHealthy'
  | 'eventConfidence'
  | 'marketConfidence'
  | 'blocker'
  | 'lastVerifiedAt'
  | 'windowLabel'

type CockpitSnapshot = SbbSessionStateV1

/** Validate and repair snapshot structure */
function cloneSnapshot(snapshot: CockpitSnapshot): CockpitSnapshot {
  // Safety: ensure required structure exists (handles corrupted localStorage)
  const base = JSON.parse(JSON.stringify(snapshot)) as CockpitSnapshot
  
  if (!base.lanes || !base.lanes.A || !base.lanes.B) {
    const fresh = buildDefaultSessionState(demoOpportunity)
    // Merge any valid data from corrupted state
    return {
      ...fresh,
      lanes: {
        A: { ...fresh.lanes.A, ...(base.lanes?.A || {}) },
        B: { ...fresh.lanes.B, ...(base.lanes?.B || {}) },
      },
      intake: base.intake || fresh.intake,
    }
  }
  
  return base
}

function bookInputFromLane(lane: LaneSessionSnapshot): import('@/lib/sbbSessionStore').BookSessionState {
  return {
    sportsbook: lane.sportsbook,
    attached: lane.attached,
    lastVerifiedAt: lane.lastVerifiedAt,
    readiness: lane.laneState === 'ready_to_confirm' ? 'ready' : 
               lane.laneState === 'attached' ? 'attached_unverified' :
               lane.laneState === 'recovering' ? 'recovering' :
               lane.laneState === 'reserved' ? 'unattached' : 'unattached',
    blocker: lane.blocker,
    windowLabel: lane.windowLabel,
    notes: '',
    healthy: lane.betslipHealthy,
    recovering: lane.laneState === 'recovering',
  }
}

function computePair(snapshot: CockpitSnapshot): PairReadinessResult {
  return evaluatePairReadiness(
    { ...bookInputFromLane(snapshot.lanes.A), blocker: snapshot.lanes.A.blocker },
    { ...bookInputFromLane(snapshot.lanes.B), blocker: snapshot.lanes.B.blocker },
  )
}

export function useSbbCockpitState() {
  const [snapshot, setSnapshot] = useState<CockpitSnapshot>(() => buildDefaultSessionState(demoOpportunity))
  const [pairReadiness, setPairReadiness] = useState<PairReadinessResult>(() =>
    computePair(buildDefaultSessionState(demoOpportunity)),
  )

  useEffect(() => {
    const loaded = loadCockpitState()
    if (loaded) {
      setSnapshot(loaded)
      setPairReadiness(computePair(loaded))
    }
  }, [])

  useEffect(() => {
    saveSessionState(snapshot)
  }, [snapshot])

  const recomputePair = useCallback(() => {
    setSnapshot((current) => {
      setPairReadiness(computePair(current))
      return current
    })
  }, [])

  const commit = useCallback((updater: (draft: CockpitSnapshot) => void) => {
    setSnapshot((prev) => {
      const draft = cloneSnapshot(prev)
      updater(draft)
      setPairReadiness(computePair(draft))
      return draft
    })
  }, [])

  const intake = snapshot.intake
  const lanes = snapshot.lanes

  const updateIntakeField = useCallback(
    (field: IntakeField, value: string) => {
      commit((draft) => {
        if (field === 'event') {
          draft.intake.event = value
          return
        }
        if (field === 'market') {
          draft.intake.market = value
          return
        }
        const [legKey, subKey] = field.split('.') as ['legA' | 'legB', 'side' | 'odds' | 'sportsbook']
        const targetLeg = legKey === 'legA' ? draft.intake.legA : draft.intake.legB
        const laneId = legKey === 'legA' ? 'A' : 'B'
        if (subKey === 'side') {
          targetLeg.side = value
          return
        }
        if (subKey === 'odds') {
          targetLeg.odds = value
          return
        }
        if (subKey === 'sportsbook') {
          const nextBook = value as Sportsbook
          targetLeg.sportsbook = nextBook
          draft.lanes[laneId].sportsbook = nextBook
        }
      })
    },
    [commit],
  )

  const setLaneSportsbook = useCallback(
    (laneId: 'A' | 'B', sportsbook: Sportsbook) => {
      commit((draft) => {
        draft.lanes[laneId].sportsbook = sportsbook
        const leg = laneId === 'A' ? draft.intake.legA : draft.intake.legB
        leg.sportsbook = sportsbook
      })
    },
    [commit],
  )

  const setLaneState = useCallback(
    (laneId: 'A' | 'B', nextState: InteractiveLaneState) => {
      setSnapshot((prev) => {
        const lane = prev.lanes[laneId]
        if (!lane?.laneState || !isValidInteractiveLaneTransition(lane.laneState as InteractiveLaneState, nextState)) {
          return prev
        }
        const draft = cloneSnapshot(prev)
        draft.lanes[laneId].laneState = nextState
        setPairReadiness(computePair(draft))
        return draft
      })
    },
    [],
  )

  const setLaneReadiness = useCallback(
    (laneId: 'A' | 'B', readiness: CockpitReadiness) => {
      commit((draft) => {
        draft.lanes[laneId].readiness = readiness
      })
    },
    [commit],
  )

  const setLaneFlag = useCallback(
    (
      laneId: 'A' | 'B',
      key: LaneFlagKey,
      value: boolean | string | null | ConfidenceLevel | LaneSessionSnapshot['windowLabel'],
    ) => {
      commit((draft) => {
        const lane = draft.lanes[laneId]
        switch (key) {
          case 'attached':
            lane.attached = Boolean(value)
            break
          case 'betslipHealthy':
            lane.betslipHealthy = Boolean(value)
            break
          case 'eventConfidence':
            lane.eventConfidence = value as ConfidenceLevel
            break
          case 'marketConfidence':
            lane.marketConfidence = value as ConfidenceLevel
            break
          case 'blocker':
            lane.blocker = value === '' ? null : (value as string | null)
            break
          case 'lastVerifiedAt':
            lane.lastVerifiedAt = value as string | null
            break
          case 'windowLabel':
            lane.windowLabel = value as LaneSessionSnapshot['windowLabel']
            break
          default:
            break
        }
      })
    },
    [commit],
  )

  const resetCockpit = useCallback(() => {
    clearPersistedSession()
    const fresh = buildDefaultSessionState(demoOpportunity)
    setSnapshot(fresh)
    setPairReadiness(computePair(fresh))
  }, [])

  return {
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
  }
}

