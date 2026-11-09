import type { Workout } from '@/features/workouts';

import {
  bestByExercise,
  estimate1RM,
  overview,
  startOfWeek,
  streakWeeks,
  volumeBuckets,
} from './stats';

// 2026-11-11 (수) 12:00 로컬
const NOW = new Date(2026, 10, 11, 12, 0).getTime();
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 9, 0).toISOString();

let n = 0;
const workout = (
  startedAt: string,
  sets: [string, number, number][] = [['bench', 100, 5]]
): Workout => {
  const id = `w${n++}`;
  return {
    id,
    startedAt,
    endedAt: startedAt,
    note: null,
    sets: sets.map(([exerciseId, weight, reps], i) => ({
      id: `${id}-${i}`,
      workoutId: id,
      exerciseId,
      setIndex: i,
      weight,
      reps,
      createdAt: startedAt,
    })),
  };
};

describe('estimate1RM', () => {
  test('Epley', () => expect(estimate1RM(100, 5)).toBe(116.7));
  test('single rep is weight', () => expect(estimate1RM(140, 1)).toBe(140));
  test('caps reps at 12', () => expect(estimate1RM(50, 20)).toBe(estimate1RM(50, 12)));
  test('zero weight', () => expect(estimate1RM(0, 10)).toBe(0));
});

test('startOfWeek is Monday', () => {
  const d = startOfWeek(NOW);
  expect(d.getDay()).toBe(1);
  expect(d.getDate()).toBe(9);
});

describe('volumeBuckets', () => {
  test('4w has 4 weekly buckets with zero fill', () => {
    const b = volumeBuckets([workout(at(2026, 11, 10)), workout(at(2026, 10, 20))], '4w', NOW);
    expect(b).toHaveLength(4);
    expect(b.map((x) => x.sessions)).toEqual([1, 0, 0, 1]);
    expect(b[3].volume).toBe(500);
  });
  test('1y has 12 monthly buckets', () => {
    const b = volumeBuckets([workout(at(2026, 1, 15))], '1y', NOW);
    expect(b).toHaveLength(12);
    expect(b[0].label).toBe('12월');
    expect(b[1].sessions).toBe(1);
  });
  test('excludes workouts before period', () => {
    const b = volumeBuckets([workout(at(2026, 1, 1))], '4w', NOW);
    expect(b.every((x) => x.sessions === 0)).toBe(true);
  });
});

describe('streakWeeks', () => {
  test('counts consecutive weeks including this week', () => {
    const ws = [workout(at(2026, 11, 10)), workout(at(2026, 11, 3)), workout(at(2026, 10, 27))];
    expect(streakWeeks(ws, NOW)).toBe(3);
  });
  test('starts from last week if this week is empty', () => {
    expect(streakWeeks([workout(at(2026, 11, 3)), workout(at(2026, 10, 28))], NOW)).toBe(2);
  });
  test('gap breaks streak', () => {
    expect(streakWeeks([workout(at(2026, 11, 10)), workout(at(2026, 10, 20))], NOW)).toBe(1);
  });
  test('empty', () => expect(streakWeeks([], NOW)).toBe(0));
});

test('bestByExercise picks highest e1RM per exercise', () => {
  const best = bestByExercise([
    workout(at(2026, 11, 1), [
      ['bench', 100, 5],
      ['squat', 140, 3],
    ]),
    workout(at(2026, 11, 8), [['bench', 105, 3]]),
  ]);
  expect(best.map((b) => b.exerciseId)).toEqual(['squat', 'bench']);
  expect(best[1]).toMatchObject({ weight: 100, reps: 5, e1rm: 116.7 });
});

test('overview aggregates the period', () => {
  const o = overview(
    [workout(at(2026, 11, 10)), workout(at(2026, 11, 3)), workout(at(2025, 1, 1))],
    '4w',
    NOW
  );
  expect(o).toMatchObject({ sessions: 2, volume: 1000, sets: 2, streakWeeks: 2 });
});
