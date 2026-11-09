import { z } from 'zod';

import type { Workout, WorkoutSet } from '../types';

export const WorkoutSetRowSchema = z
  .object({
    id: z.string().uuid(),
    workout_id: z.string().uuid(),
    exercise_id: z.string().uuid(),
    set_index: z.number().int(),
    weight: z.coerce.number(),
    reps: z.number().int(),
    created_at: z.string(),
  })
  .transform((r): WorkoutSet => ({
    id: r.id,
    workoutId: r.workout_id,
    exerciseId: r.exercise_id,
    setIndex: r.set_index,
    weight: r.weight,
    reps: r.reps,
    createdAt: r.created_at,
  }));

export const WorkoutRowSchema = z
  .object({
    id: z.string().uuid(),
    started_at: z.string(),
    ended_at: z.string().nullable(),
    note: z.string().nullable(),
    workout_sets: z.array(WorkoutSetRowSchema).default([]),
  })
  .transform((r): Workout => ({
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    note: r.note,
    sets: [...r.workout_sets].sort((a, b) => a.setIndex - b.setIndex),
  }));

export const WorkoutListSchema = z.array(WorkoutRowSchema);

/** 세트 입력 폼 (문자열 입력 → 숫자) */
export const SetFormSchema = z.object({
  weight: z.coerce
    .number({ error: '무게를 숫자로 입력하세요.' })
    .min(0, '무게는 0 이상이어야 합니다.')
    .max(2500, '무게가 너무 큽니다.'), // lb 입력까지 고려한 표시 단위 상한
  reps: z.coerce
    .number({ error: '횟수를 숫자로 입력하세요.' })
    .int('횟수는 정수로 입력하세요.')
    .min(1, '횟수는 1 이상이어야 합니다.')
    .max(1000, '횟수가 너무 큽니다.'),
});

/** 라우트 파라미터 /workout/[id] */
export const WorkoutIdParamSchema = z.string().uuid();
