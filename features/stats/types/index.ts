export const PERIODS = ['4w', '12w', '1y'] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<Period, string> = { '4w': '4주', '12w': '12주', '1y': '1년' };

export type VolumeBucket = {
  key: string; // 버킷 시작일 (YYYY-MM-DD)
  label: string; // 차트 축 라벨
  volume: number;
  sessions: number;
};

export type ExerciseBest = {
  exerciseId: string;
  e1rm: number; // 추정 1RM (Epley)
  weight: number;
  reps: number;
  date: string;
};

export type StatsOverview = {
  sessions: number;
  volume: number;
  sets: number;
  avgSessionsPerWeek: number;
  streakWeeks: number;
};
