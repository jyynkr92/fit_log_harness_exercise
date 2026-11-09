import { create } from 'zustand';

import { listWorkoutsSince, type Workout } from '@/features/workouts';
import { type AsyncStatus, errorMessage, isNetworkError } from '@/lib/errors';

import { periodStart } from '../service/stats';
import type { Period } from '../types';

/**
 * 통계 데이터. 기간별로 서버에서 해당 기간만 가져온다 (기록 목록 페이지네이션과 독립).
 * revision 이 바뀌면(운동 기록이 서버에 반영되면) 다시 가져온다.
 */
type Entry = {
  workouts: Workout[];
  revision: number;
  status: AsyncStatus;
  error: string | null;
  offline: boolean;
  owner: string; // 사용자 전환 시 다른 계정 통계를 보여주지 않도록
};

type StatsState = {
  period: Period;
  entries: Partial<Record<Period, Entry>>;
  setPeriod: (p: Period) => void;
  fetch: (period: Period, owner: string, revision: number, fallback: Workout[]) => Promise<void>;
  invalidate: (period: Period) => void;
  reset: () => void;
};

export const useStatsStore = create<StatsState>((set, get) => ({
  period: '4w',
  entries: {},
  setPeriod: (period) => set({ period }),

  fetch: async (period, owner, revision, fallback) => {
    const cur = get().entries[period];
    if (
      cur &&
      cur.owner === owner &&
      (cur.status === 'loading' ||
        // 오프라인 결과는 로컬 기록이 바뀔 때마다 다시 계산한다
        (cur.status === 'success' && cur.revision === revision && !cur.offline))
    )
      return;
    const put = (e: Partial<Entry>) =>
      set({
        entries: {
          ...get().entries,
          [period]: {
            workouts: [],
            revision,
            status: 'idle',
            error: null,
            offline: false,
            owner,
            ...(get().entries[period]?.owner === owner ? get().entries[period] : {}),
            ...e,
          },
        },
      });
    put({ status: cur?.offline ? 'success' : 'loading', revision }); // 오프라인 재계산 중엔 깜빡이지 않게
    try {
      const workouts = await listWorkoutsSince(periodStart(period, Date.now()).toISOString());
      put({ workouts, status: 'success', error: null, offline: false });
    } catch (e) {
      // 오프라인: 기기에 있는 기록(최근 페이지 + 대기 중 기록)으로 계산
      if (isNetworkError(e)) put({ workouts: fallback, status: 'success', offline: true });
      else put({ status: 'error', error: errorMessage(e) });
    }
  },

  invalidate: (period) => {
    const { [period]: _drop, ...rest } = get().entries;
    set({ entries: rest });
  },

  reset: () => set({ entries: {} }),
}));
