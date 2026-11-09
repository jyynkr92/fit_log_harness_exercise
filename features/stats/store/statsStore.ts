import { create } from 'zustand';

import type { Period } from '../types';

/** 통계 화면 UI 상태. 데이터 자체는 workouts 스토어가 진실. */
type StatsState = {
  period: Period;
  setPeriod: (p: Period) => void;
};

export const useStatsStore = create<StatsState>((set) => ({
  period: '4w',
  setPeriod: (period) => set({ period }),
}));
