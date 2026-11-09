import { z } from 'zod';

import type { OutboxOp } from '../types';

/** 기기에 저장된 아웃박스 파싱 (앱 업데이트로 형식이 바뀌어도 안전하게) */
const SetSnapshotSchema = z.object({
  id: z.string(),
  workoutId: z.string(),
  exerciseId: z.string(),
  setIndex: z.number().int(),
  weight: z.number(),
  reps: z.number().int(),
  createdAt: z.string(),
});

const OutboxOpSchema = z.discriminatedUnion('kind', [
  z.object({
    opId: z.string(),
    kind: z.literal('startWorkout'),
    workoutId: z.string(),
    startedAt: z.string(),
  }),
  z.object({
    opId: z.string(),
    kind: z.literal('finishWorkout'),
    workoutId: z.string(),
    endedAt: z.string(),
  }),
  z.object({ opId: z.string(), kind: z.literal('deleteWorkout'), workoutId: z.string() }),
  z.object({
    opId: z.string(),
    kind: z.literal('addSet'),
    workoutId: z.string(),
    set: SetSnapshotSchema,
  }),
  z.object({
    opId: z.string(),
    kind: z.literal('deleteSet'),
    workoutId: z.string(),
    setId: z.string(),
  }),
]);

export const OutboxSchema: z.ZodType<OutboxOp[]> = z.array(OutboxOpSchema);
