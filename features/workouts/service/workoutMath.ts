import type { ExerciseSetGroup, Workout, WorkoutSet, WorkoutSummary } from '../types';

/** 순수 함수만. I/O·React 금지 (ARCHITECTURE.md#레이어) */

export const setVolume = (s: Pick<WorkoutSet, 'weight' | 'reps'>) => s.weight * s.reps;

export const totalVolume = (sets: Pick<WorkoutSet, 'weight' | 'reps'>[]) =>
  sets.reduce((sum, s) => sum + setVolume(s), 0);

export function workoutDurationMs(w: Pick<Workout, 'startedAt' | 'endedAt'>, now = Date.now()) {
  const end = w.endedAt ? Date.parse(w.endedAt) : now;
  return Math.max(0, end - Date.parse(w.startedAt));
}

export function summarizeWorkout(w: Workout, now = Date.now()): WorkoutSummary {
  return {
    volume: totalVolume(w.sets),
    setCount: w.sets.length,
    exerciseCount: new Set(w.sets.map((s) => s.exerciseId)).size,
    durationMs: workoutDurationMs(w, now),
  };
}

/** 처음 등장한 순서를 유지하며 종목별로 세트를 묶는다. */
export function groupSetsByExercise(sets: WorkoutSet[]): ExerciseSetGroup[] {
  const order: string[] = [];
  const map = new Map<string, WorkoutSet[]>();
  for (const s of [...sets].sort((a, b) => a.setIndex - b.setIndex)) {
    if (!map.has(s.exerciseId)) {
      map.set(s.exerciseId, []);
      order.push(s.exerciseId);
    }
    map.get(s.exerciseId)!.push(s);
  }
  return order.map((exerciseId) => ({ exerciseId, sets: map.get(exerciseId)! }));
}

export const nextSetIndex = (sets: WorkoutSet[]) =>
  sets.reduce((max, s) => Math.max(max, s.setIndex), -1) + 1;

export const findActiveWorkout = (workouts: Workout[]) =>
  workouts.find((w) => w.endedAt === null) ?? null;

export const DEFAULT_SET = { weight: 20, reps: 10 } as const;

/**
 * 다음 세트 기본값: 현재 운동의 같은 종목 마지막 세트 → 이전 운동의 같은 종목 마지막 세트 → 기본값.
 * (스펙: 지난번 값 프리필, docs/product-specs/workout-logging.md)
 */
export function suggestNextSet(
  workouts: Workout[],
  currentWorkoutId: string,
  exerciseId: string
): { weight: number; reps: number } {
  const lastOf = (sets: WorkoutSet[]) =>
    [...sets].filter((s) => s.exerciseId === exerciseId).sort((a, b) => b.setIndex - a.setIndex)[0];

  const current = workouts.find((w) => w.id === currentWorkoutId);
  const inCurrent = current && lastOf(current.sets);
  if (inCurrent) return { weight: inCurrent.weight, reps: inCurrent.reps };

  const previous = workouts
    .filter((w) => w.id !== currentWorkoutId)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  for (const w of previous) {
    const s = lastOf(w.sets);
    if (s) return { weight: s.weight, reps: s.reps };
  }
  return { ...DEFAULT_SET };
}

/** 스테퍼 조작 (음수 방지, 소수점 오차 제거) */
export function stepValue(value: number, delta: number, min = 0) {
  return Math.max(min, Math.round((value + delta) * 100) / 100);
}
