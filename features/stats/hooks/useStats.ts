import { useEffect, useMemo } from 'react';

import { useCurrentUser } from '@/features/auth';
import { useWorkouts, useWorkoutsRevision } from '@/features/workouts';
import { useNow } from '@/lib/useNow';

import { bestByExercise, inPeriod, overview, volumeBuckets } from '../service/stats';
import { useStatsStore } from '../store/statsStore';
import type { Period } from '../types';

export function useStats(periodOverride?: Period) {
  const { workouts: local, status: localStatus } = useWorkouts();
  const revision = useWorkoutsRevision();
  const storePeriod = useStatsStore((s) => s.period);
  const setPeriod = useStatsStore((s) => s.setPeriod);
  const fetch = useStatsStore((s) => s.fetch);
  const invalidate = useStatsStore((s) => s.invalidate);
  const period = periodOverride ?? storePeriod;
  const raw = useStatsStore((s) => s.entries[period]);
  const now = useNow(60_000);
  const owner = useCurrentUser()?.id ?? '';

  // 로컬 목록이 준비된 뒤 가져온다 (오프라인 대체 데이터로 쓰기 위해)
  useEffect(() => {
    if (owner && localStatus === 'success') void fetch(period, owner, revision, local);
  }, [owner, period, revision, localStatus, local, fetch]);

  const entry = raw && raw.owner === owner ? raw : undefined;

  const data = useMemo(() => {
    const withSets = (entry?.workouts ?? []).filter((w) => w.sets.length > 0);
    return {
      overview: overview(withSets, period, now),
      buckets: volumeBuckets(withSets, period, now),
      bests: bestByExercise(inPeriod(withSets, period, now)),
      hasAny: withSets.length > 0,
    };
  }, [entry, period, now]);

  const status = !entry ? 'loading' : entry.status;
  return {
    ...data,
    period,
    setPeriod,
    status,
    error: entry?.error ?? null,
    offline: entry?.offline ?? false,
    reload: () => {
      invalidate(period);
      void fetch(period, owner, revision, local);
    },
  };
}
