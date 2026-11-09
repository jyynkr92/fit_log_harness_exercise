import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { EXERCISE_CATEGORIES, type Exercise } from '../types';

/** 종목 목록 캐시 (오프라인에서도 종목 선택이 되도록). 사용자별 키. */
const key = (userId: string) => `fitlog.exercises.v1.${userId}`;

const CachedExercisesSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(EXERCISE_CATEGORIES),
    isCustom: z.boolean(),
  })
);

export async function loadExerciseCache(userId: string): Promise<Exercise[]> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    const parsed = raw ? CachedExercisesSchema.safeParse(JSON.parse(raw)) : null;
    return parsed?.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export const saveExerciseCache = (userId: string, exercises: Exercise[]) =>
  AsyncStorage.setItem(key(userId), JSON.stringify(exercises));
