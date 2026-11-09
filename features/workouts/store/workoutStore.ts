import { create } from 'zustand';

import { type AsyncStatus, errorMessage } from '@/lib/errors';

import * as workoutRepo from '../repo/workoutRepo';
import { nextSetIndex } from '../service/workoutMath';
import type { NewSetInput, Workout, WorkoutSet } from '../types';

type WorkoutState = {
  workouts: Workout[]; // started_at 내림차순
  status: AsyncStatus;
  error: string | null;
  load: () => Promise<void>;
  start: () => Promise<Workout>;
  finish: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addSet: (input: NewSetInput) => Promise<void>;
  removeSet: (workoutId: string, setId: string) => Promise<void>;
  reset: () => void;
};

const patchWorkout = (list: Workout[], id: string, fn: (w: Workout) => Workout) =>
  list.map((w) => (w.id === id ? fn(w) : w));

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  status: 'idle',
  error: null,

  load: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      set({ workouts: await workoutRepo.listWorkouts(), status: 'success' });
    } catch (e) {
      set({ status: 'error', error: errorMessage(e) });
    }
  },

  start: async () => {
    const created = await workoutRepo.startWorkout();
    set({ workouts: [created, ...get().workouts] });
    return created;
  },

  finish: async (id) => {
    const endedAt = new Date().toISOString();
    await workoutRepo.finishWorkout(id, endedAt);
    set({ workouts: patchWorkout(get().workouts, id, (w) => ({ ...w, endedAt })) });
  },

  remove: async (id) => {
    await workoutRepo.deleteWorkout(id);
    set({ workouts: get().workouts.filter((w) => w.id !== id) });
  },

  // 낙관적 업데이트: 즉시 반영 → 서버 응답으로 교체, 실패 시 롤백 (docs/RELIABILITY.md)
  addSet: async (input) => {
    const workout = get().workouts.find((w) => w.id === input.workoutId);
    if (!workout) return;
    const setIndex = nextSetIndex(workout.sets);
    const tempId = `temp-${Date.now()}`;
    const optimistic: WorkoutSet = {
      ...input,
      id: tempId,
      setIndex,
      createdAt: new Date().toISOString(),
    };
    set({
      workouts: patchWorkout(get().workouts, input.workoutId, (w) => ({
        ...w,
        sets: [...w.sets, optimistic],
      })),
    });
    try {
      const saved = await workoutRepo.addSet({ ...input, setIndex });
      set({
        workouts: patchWorkout(get().workouts, input.workoutId, (w) => ({
          ...w,
          sets: w.sets.map((s) => (s.id === tempId ? saved : s)),
        })),
      });
    } catch (e) {
      set({
        workouts: patchWorkout(get().workouts, input.workoutId, (w) => ({
          ...w,
          sets: w.sets.filter((s) => s.id !== tempId),
        })),
      });
      throw e;
    }
  },

  removeSet: async (workoutId, setId) => {
    const before = get().workouts;
    set({
      workouts: patchWorkout(before, workoutId, (w) => ({
        ...w,
        sets: w.sets.filter((s) => s.id !== setId),
      })),
    });
    try {
      await workoutRepo.deleteSet(setId);
    } catch (e) {
      set({ workouts: before });
      throw e;
    }
  },

  reset: () => set({ workouts: [], status: 'idle', error: null }),
}));
