'use client'

import { useCallback, useEffect, useState } from 'react'

import type { CockpitReadiness, ConfidenceLevel, InteractiveLaneState, Sportsbook } from '@/lib/sbb'
import { demoOpportunity, isValidInteractiveLaneTransition } from '@/lib/sbb'
import { evaluatePairReadiness, type PairReadinessResult } from '@/lib/sbbReadiness'
import {
  buildDefaultSessionState,
  loadSessionState,
  resetSessionState as clearPersistedSession,
  saveSessionState,
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

function cloneSnapshot(snapshot: CockpitSnapshot): CockpitSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as CockpitSnapshot
}

function bookInputFromLane(lane: LaneSessionSnapshot) {
  return {
    sportsbook: lane.sportsbook,
    attached: lane.attached,
    betslipHealthy: lane.betslipHealthy,
    eventConfidence: lane.eventConfidence,
    marketConfidence: lane.marketConfidence,
    lastVerifiedAt: lane.lastVerifiedAt,
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
    const loaded = loadSessionState()
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
        if (!isValidInteractiveLaneTransition(lane.laneState, nextState)) {
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
