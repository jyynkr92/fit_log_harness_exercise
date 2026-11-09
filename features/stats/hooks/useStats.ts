import { useMemo } from 'react';

import { useWorkouts } from '@/features/workouts';
import { useNow } from '@/lib/useNow';

import { bestByExercise, inPeriod, overview, volumeBuckets } from '../service/stats';
import { useStatsStore } from '../store/statsStore';
import type { Period } from '../types';

export function useStats(periodOverride?: Period) {
  const { workouts, status, error, reload } = useWorkouts();
  const storePeriod = useStatsStore((s) => s.period);
  const setPeriod = useStatsStore((s) => s.setPeriod);
  const period = periodOverride ?? storePeriod;
  const now = useNow(60_000);

  const data = useMemo(() => {
    const withSets = workouts.filter((w) => w.sets.length > 0);
    return {
      overview: overview(withSets, period, now),
      buckets: volumeBuckets(withSets, period, now),
      bests: bestByExercise(inPeriod(withSets, period, now)),
      hasAny: withSets.length > 0,
    };
  }, [workouts, period, now]);

  return { ...data, period, setPeriod, status, error, reload };
}
