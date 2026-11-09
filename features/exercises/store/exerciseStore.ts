import { create } from 'zustand';

import { type AsyncStatus, errorMessage, toAppError } from '@/lib/errors';

import * as exerciseRepo from '../repo/exerciseRepo';
import { NewExerciseNameSchema } from '../schema/exercise';
import type { Exercise, ExerciseCategory } from '../types';

type ExerciseState = {
  exercises: Exercise[];
  status: AsyncStatus;
  error: string | null;
  load: () => Promise<void>;
  add: (name: string, category: ExerciseCategory, ownerId: string) => Promise<Exercise>;
  reset: () => void;
};

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  status: 'idle',
  error: null,

  load: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      set({ exercises: await exerciseRepo.listExercises(), status: 'success' });
    } catch (e) {
      set({ status: 'error', error: errorMessage(e) });
    }
  },

  add: async (rawName, category, ownerId) => {
    const parsed = NewExerciseNameSchema.safeParse(rawName);
    if (!parsed.success) throw toAppError(null, parsed.error.issues[0]?.message);
    const created = await exerciseRepo.createExercise(parsed.data, category, ownerId);
    set({
      exercises: [...get().exercises, created].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    });
    return created;
  },

  reset: () => set({ exercises: [], status: 'idle', error: null }),
}));
