import type { Workout } from '@/features/workouts';

import type { ExerciseBest, Period, StatsOverview, VolumeBucket } from '../types';

/** 통계 계산. 모두 순수 함수 + 테스트 (docs/product-specs/stats.md) */

const DAY = 86_400_000;
// service는 순수해야 하므로 다른 feature는 type-only import만 한다 (check-architecture INV1/service-runtime-import)
const totalVolume = (sets: Workout['sets']) => sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Epley 공식. 1회는 그대로, 12회 초과는 추정 오차가 커서 12회로 캡 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + Math.min(reps, 12) / 30) * 10) / 10;
}

/** 로컬 시간 기준 그 주의 월요일 00:00 */
export function startOfWeek(t: number | Date): Date {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // 월=0
  d.setDate(d.getDate() - diff);
  return d;
}

const startOfMonth = (t: number | Date) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export function periodStart(period: Period, now: number): Date {
  const thisWeek = startOfWeek(now);
  if (period === '4w') return new Date(thisWeek.getTime() - 3 * 7 * DAY);
  if (period === '12w') return new Date(thisWeek.getTime() - 11 * 7 * DAY);
  const m = startOfMonth(now);
  return new Date(m.getFullYear(), m.getMonth() - 11, 1);
}

export const inPeriod = (workouts: Workout[], period: Period, now: number) => {
  const from = periodStart(period, now).getTime();
  return workouts.filter((w) => Date.parse(w.startedAt) >= from && Date.parse(w.startedAt) <= now);
};

/** 4주/12주는 주 단위, 1년은 월 단위 버킷. 운동 없는 구간도 0으로 채운다. */
export function volumeBuckets(workouts: Workout[], period: Period, now: number): VolumeBucket[] {
  const monthly = period === '1y';
  const buckets: VolumeBucket[] = [];
  let cursor = periodStart(period, now);
  const end = now;
  while (cursor.getTime() <= end) {
    buckets.push({
      key: ymd(cursor),
      label: monthly
        ? `${cursor.getMonth() + 1}월`
        : `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      volume: 0,
      sessions: 0,
    });
    cursor = monthly
      ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      : new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const w of inPeriod(workouts, period, now)) {
    const t = Date.parse(w.startedAt);
    const i = index.get(ymd(monthly ? startOfMonth(t) : startOfWeek(t)));
    if (i === undefined) continue;
    buckets[i].volume += totalVolume(w.sets);
    buckets[i].sessions += 1;
  }
  return buckets;
}

/** 연속 운동 주 수. 이번 주에 아직 운동이 없으면 지난주부터 센다. */
export function streakWeeks(workouts: Workout[], now: number): number {
  const weeks = new Set(workouts.map((w) => startOfWeek(Date.parse(w.startedAt)).getTime()));
  let cursor = startOfWeek(now);
  if (!weeks.has(cursor.getTime())) cursor = new Date(cursor.getTime() - 7 * DAY);
  let count = 0;
  while (weeks.has(cursor.getTime())) {
    count += 1;
    cursor = startOfWeek(cursor.getTime() - 3 * DAY); // DST 안전하게 이전 주로
  }
  return count;
}

/** 종목별 최고 추정 1RM, 높은 순 */
export function bestByExercise(workouts: Workout[]): ExerciseBest[] {
  const best = new Map<string, ExerciseBest>();
  for (const w of workouts) {
    for (const s of w.sets) {
      const e1rm = estimate1RM(s.weight, s.reps);
      const cur = best.get(s.exerciseId);
      if (!cur || e1rm > cur.e1rm) {
        best.set(s.exerciseId, {
          exerciseId: s.exerciseId,
          e1rm,
          weight: s.weight,
          reps: s.reps,
          date: w.startedAt,
        });
      }
    }
  }
  return [...best.values()].filter((b) => b.e1rm > 0).sort((a, b) => b.e1rm - a.e1rm);
}

export function overview(workouts: Workout[], period: Period, now: number): StatsOverview {
  const list = inPeriod(workouts, period, now);
  const weeks = Math.max(1, Math.ceil((now - periodStart(period, now).getTime()) / (7 * DAY)));
  return {
    sessions: list.length,
    volume: list.reduce((sum, w) => sum + totalVolume(w.sets), 0),
    sets: list.reduce((sum, w) => sum + w.sets.length, 0),
    avgSessionsPerWeek: Math.round((list.length / weeks) * 10) / 10,
    streakWeeks: streakWeeks(workouts, now),
  };
}
