import { useEffect, useMemo } from 'react';

import { useCurrentUser } from '@/features/auth';

import { useExerciseStore } from '../store/exerciseStore';
import type { Exercise } from '../types';

/** 로그인한 사용자의 종목 목록. 사용자가 바뀌면 다시 불러온다. */
export function useExercises() {
  const userId = useCurrentUser()?.id;
  const { exercises, status, error, load, reset } = useExerciseStore();

  useEffect(() => {
    if (!userId) reset();
    else if (status === 'idle') load();
  }, [userId, status, load, reset]);

  return { exercises, status, error, reload: load };
}

/** id → 종목 조회 맵 */
export function useExerciseLookup(): Map<string, Exercise> {
  const { exercises } = useExercises();
  return useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
}

export function useAddExercise() {
  const userId = useCurrentUser()?.id;
  const add = useExerciseStore((s) => s.add);
  return (name: string, category: Exercise['category']) => {
    if (!userId) throw new Error('로그인이 필요합니다.');
    return add(name, category, userId);
  };
}
