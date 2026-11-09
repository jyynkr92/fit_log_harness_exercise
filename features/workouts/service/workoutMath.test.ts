import type { Workout, WorkoutSet } from '../types';
import {
  findActiveWorkout,
  groupSetsByExercise,
  nextSetIndex,
  stepValue,
  suggestNextSet,
  summarizeWorkout,
  totalVolume,
} from './workoutMath';

const set = (p: Partial<WorkoutSet> & Pick<WorkoutSet, 'exerciseId' | 'setIndex'>): WorkoutSet => ({
  id: `s${p.setIndex}-${p.exerciseId}`,
  workoutId: 'w1',
  weight: 100,
  reps: 5,
  createdAt: '2026-11-01T10:00:00Z',
  ...p,
});

const workout = (p: Partial<Workout> & Pick<Workout, 'id'>): Workout => ({
  startedAt: '2026-11-01T10:00:00Z',
  endedAt: '2026-11-01T11:00:00Z',
  note: null,
  sets: [],
  ...p,
});

describe('workoutMath', () => {
  test('totalVolume = Σ weight × reps', () => {
    expect(
      totalVolume([
        set({ exerciseId: 'a', setIndex: 0 }),
        set({ exerciseId: 'a', setIndex: 1, weight: 50, reps: 10 }),
      ])
    ).toBe(1000);
  });

  test('summarizeWorkout counts sets, exercises and duration', () => {
    const w = workout({
      id: 'w1',
      sets: [set({ exerciseId: 'a', setIndex: 0 }), set({ exerciseId: 'b', setIndex: 1 })],
    });
    expect(summarizeWorkout(w)).toEqual({
      volume: 1000,
      setCount: 2,
      exerciseCount: 2,
      durationMs: 3_600_000,
    });
  });

  test('ongoing workout duration uses now', () => {
    const w = workout({ id: 'w1', endedAt: null });
    expect(summarizeWorkout(w, Date.parse('2026-11-01T10:30:00Z')).durationMs).toBe(1_800_000);
  });

  test('groupSetsByExercise keeps first-appearance order', () => {
    const groups = groupSetsByExercise([
      set({ exerciseId: 'b', setIndex: 2 }),
      set({ exerciseId: 'a', setIndex: 0 }),
      set({ exerciseId: 'b', setIndex: 1 }),
    ]);
    expect(groups.map((g) => g.exerciseId)).toEqual(['a', 'b']);
    expect(groups[1].sets.map((s) => s.setIndex)).toEqual([1, 2]);
  });

  test('nextSetIndex starts at 0', () => {
    expect(nextSetIndex([])).toBe(0);
    expect(nextSetIndex([set({ exerciseId: 'a', setIndex: 4 })])).toBe(5);
  });

  test('findActiveWorkout returns unfinished workout', () => {
    expect(findActiveWorkout([workout({ id: 'a' }), workout({ id: 'b', endedAt: null })])?.id).toBe(
      'b'
    );
    expect(findActiveWorkout([workout({ id: 'a' })])).toBeNull();
  });

  describe('suggestNextSet', () => {
    const prev = workout({
      id: 'old',
      startedAt: '2026-10-30T10:00:00Z',
      sets: [set({ exerciseId: 'bench', setIndex: 0, weight: 60, reps: 8 })],
    });
    const current = workout({
      id: 'now',
      endedAt: null,
      sets: [set({ exerciseId: 'bench', setIndex: 0, weight: 70, reps: 6 })],
    });

    test('prefers last set in current workout', () => {
      expect(suggestNextSet([prev, current], 'now', 'bench')).toEqual({ weight: 70, reps: 6 });
    });
    test('falls back to previous workout', () => {
      expect(suggestNextSet([prev, workout({ id: 'now', endedAt: null })], 'now', 'bench')).toEqual(
        { weight: 60, reps: 8 }
      );
    });
    test('falls back to default', () => {
      expect(suggestNextSet([], 'now', 'squat')).toEqual({ weight: 20, reps: 10 });
    });
  });

  test('stepValue clamps and rounds', () => {
    expect(stepValue(0, -2.5)).toBe(0);
    expect(stepValue(0.1, 0.2)).toBe(0.3);
    expect(stepValue(1, -1, 1)).toBe(1);
  });
});
