import { create } from 'zustand';

import { type AsyncStatus, errorMessage, isNetworkError, toAppError } from '@/lib/errors';

import * as exerciseRepo from '../repo/exerciseRepo';
import { loadExerciseCache, saveExerciseCache } from '../repo/localStore';
import { NewExerciseNameSchema } from '../schema/exercise';
import type { Exercise, ExerciseCategory } from '../types';

type ExerciseState = {
  exercises: Exercise[];
  status: AsyncStatus;
  error: string | null;
  load: (userId: string) => Promise<void>;
  add: (name: string, category: ExerciseCategory, ownerId: string) => Promise<Exercise>;
  reset: () => void;
};

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  status: 'idle',
  error: null,

  load: async (userId) => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      const exercises = await exerciseRepo.listExercises();
      void saveExerciseCache(userId, exercises);
      set({ exercises, status: 'success' });
    } catch (e) {
      // 오프라인이면 마지막으로 받은 목록으로 계속 기록할 수 있게 한다
      const cached = isNetworkError(e) ? await loadExerciseCache(userId) : [];
      if (cached.length > 0) set({ exercises: cached, status: 'success' });
      else set({ status: 'error', error: errorMessage(e) });
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
