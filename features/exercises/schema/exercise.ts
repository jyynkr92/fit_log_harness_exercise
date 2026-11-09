import { z } from 'zod';

import { EXERCISE_CATEGORIES, type Exercise } from '../types';

/** Supabase exercises 행 → 도메인 타입 (경계 파싱) */
export const ExerciseRowSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    category: z.string(),
    owner_id: z.string().uuid().nullable(),
  })
  .transform((r): Exercise => ({
    id: r.id,
    name: r.name,
    category: (EXERCISE_CATEGORIES as readonly string[]).includes(r.category)
      ? (r.category as Exercise['category'])
      : 'etc',
    isCustom: r.owner_id !== null,
  }));

export const ExerciseListSchema = z.array(ExerciseRowSchema);

export const NewExerciseNameSchema = z
  .string()
  .trim()
  .min(1, '종목 이름을 입력하세요.')
  .max(60, '60자 이하로 입력하세요.');
