import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { OutboxSchema } from '../schema/outbox';
import type { OutboxOp, Workout } from '../types';

/**
 * 기기 로컬 저장 (AsyncStorage). 운동 기록만 저장하고 토큰·개인정보는 두지 않는다 (docs/SECURITY.md).
 * 키는 사용자별로 분리한다.
 */
const outboxKey = (userId: string) => `fitlog.outbox.v1.${userId}`;
const cacheKey = (userId: string) => `fitlog.workouts.v1.${userId}`;

async function readJson<T>(key: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback; // 형식이 바뀐 옛 데이터는 버린다
  } catch {
    return fallback;
  }
}

export const loadOutbox = (userId: string) => readJson(outboxKey(userId), OutboxSchema, []);
export const saveOutbox = (userId: string, ops: OutboxOp[]) =>
  AsyncStorage.setItem(outboxKey(userId), JSON.stringify(ops));

/** 캐시는 DB 행 형태가 아니라 도메인 형태로 저장하므로 별도 스키마로 검증 */
const CachedWorkoutsSchema = z.array(
  z.object({
    id: z.string(),
    startedAt: z.string(),
    endedAt: z.string().nullable(),
    note: z.string().nullable(),
    sets: z.array(
      z.object({
        id: z.string(),
        workoutId: z.string(),
        exerciseId: z.string(),
        setIndex: z.number(),
        weight: z.number(),
        reps: z.number(),
        createdAt: z.string(),
      })
    ),
  })
);

export const loadWorkoutCache = (userId: string): Promise<Workout[]> =>
  readJson(cacheKey(userId), CachedWorkoutsSchema, []);
export const saveWorkoutCache = (userId: string, workouts: Workout[]) =>
  AsyncStorage.setItem(
    cacheKey(userId),
    JSON.stringify(workouts.filter((w) => !w.pending).map(({ pending: _p, ...w }) => w))
  );

