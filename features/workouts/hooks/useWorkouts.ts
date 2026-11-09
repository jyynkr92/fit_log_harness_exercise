import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';

import { useCurrentUser } from '@/features/auth';
import { subscribeOnline } from '@/lib/network';

import { WorkoutIdParamSchema } from '../schema/workout';
import { findActiveWorkout } from '../service/workoutMath';
import { useWorkoutStore } from '../store/workoutStore';
import type { SyncState } from '../types';

const RETRY_MS = 15_000;

/** 로그인한 사용자의 운동 목록. 사용자가 바뀌면 다시 불러온다. */
export function useWorkouts() {
  const userId = useCurrentUser()?.id;
  const workouts = useWorkoutStore((s) => s.workouts);
  const status = useWorkoutStore((s) => s.status);
  const error = useWorkoutStore((s) => s.error);
  const loadedFor = useWorkoutStore((s) => s.userId);
  const load = useWorkoutStore((s) => s.load);
  const reset = useWorkoutStore((s) => s.reset);

  useEffect(() => {
    if (!userId) {
      if (loadedFor) reset();
    } else if (status === 'idle' || loadedFor !== userId) {
      void load(userId);
    }
  }, [userId, loadedFor, status, load, reset]);

  const reload = () => (userId ? load(userId) : Promise.resolve());
  return { workouts, status, error, reload };
}

/**
 * 아웃박스 동기화 트리거. 탭 레이아웃에서 한 번 마운트한다.
 * - 연결 복구 시, 앱이 포그라운드로 올 때, 대기 작업이 있으면 15초마다 재시도
 */
export function useWorkoutSync() {
  const flush = useWorkoutStore((s) => s.flush);
  const setOnline = useWorkoutStore((s) => s.setOnline);
  const pending = useWorkoutStore((s) => s.outbox.length);

  useEffect(() => subscribeOnline(setOnline), [setOnline]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void flush();
    });
    return () => sub.remove();
  }, [flush]);

  useEffect(() => {
    if (pending === 0) return;
    const id = setInterval(() => void flush(), RETRY_MS);
    return () => clearInterval(id);
  }, [pending, flush]);
}

export function useSyncState(): SyncState {
  const online = useWorkoutStore((s) => s.online);
  const syncing = useWorkoutStore((s) => s.syncing);
  const pendingCount = useWorkoutStore((s) => s.outbox.length);
  const lastError = useWorkoutStore((s) => s.syncError);
  return { online, syncing, pendingCount, lastError };
}

/** 서버 데이터가 바뀔 때마다 증가하는 값 (다른 도메인이 재조회 신호로 사용) */
export const useWorkoutsRevision = () => useWorkoutStore((s) => s.revision);

/** 기록 탭: 다음 페이지 불러오기 */
export function useWorkoutPaging() {
  const hasMore = useWorkoutStore((s) => s.hasMore);
  const loadingMore = useWorkoutStore((s) => s.loadingMore);
  const loadMore = useWorkoutStore((s) => s.loadMore);
  return { hasMore, loadingMore, loadMore };
}

export function useActiveWorkout() {
  const { workouts } = useWorkouts();
  return useMemo(() => findActiveWorkout(workouts), [workouts]);
}

/** 라우트 파라미터(경계 입력)를 파싱해 해당 운동을 찾는다. */
export function useWorkoutByParam(rawId: unknown) {
  const { workouts, status, error, reload } = useWorkouts();
  const parsed = WorkoutIdParamSchema.safeParse(rawId);
  const workout = parsed.success ? (workouts.find((w) => w.id === parsed.data) ?? null) : null;
  return { workout, workouts, status, error, reload, invalidId: !parsed.success };
}

export function useWorkoutActions() {
  const start = useWorkoutStore((s) => s.start);
  const finish = useWorkoutStore((s) => s.finish);
  const remove = useWorkoutStore((s) => s.remove);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  return { start, finish, remove, addSet, removeSet };
}
