import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

import { type AsyncStatus, errorMessage, isNetworkError } from '@/lib/errors';

import * as local from '../repo/localStore';
import * as workoutRepo from '../repo/workoutRepo';
import { applyOutbox, enqueue, mergePages } from '../service/outbox';
import { nextSetIndex } from '../service/workoutMath';
import type { NewSetInput, OutboxOp, Workout } from '../types';

/**
 * 오프라인 우선 스토어 (docs/RELIABILITY.md "오프라인").
 * 모든 변경은 아웃박스에 먼저 쌓이고(기기에 저장), flush 가 순서대로 서버에 보낸다.
 * 화면에 보이는 workouts = 서버 목록 + 아웃박스 재생 결과.
 */
type OpInput = OutboxOp extends infer T ? (T extends OutboxOp ? Omit<T, 'opId'> : never) : never;

type WorkoutState = {
  userId: string | null;
  server: Workout[]; // 서버에서 확인된 목록 (불러온 페이지들)
  outbox: OutboxOp[];
  workouts: Workout[]; // 화면용 (server + outbox)
  status: AsyncStatus;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  online: boolean;
  syncing: boolean;
  syncError: string | null;
  revision: number; // 서버 데이터가 바뀔 때마다 증가 (통계 재조회 신호)

  load: (userId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  flush: () => Promise<void>;
  setOnline: (online: boolean) => void;
  start: () => Promise<string>;
  finish: (workoutId: string) => Promise<void>;
  remove: (workoutId: string) => Promise<void>;
  addSet: (input: NewSetInput) => Promise<void>;
  removeSet: (workoutId: string, setId: string) => Promise<void>;
  reset: () => void;
};

const INITIAL = {
  userId: null,
  server: [],
  outbox: [],
  workouts: [],
  status: 'idle' as AsyncStatus,
  error: null,
  hasMore: false,
  loadingMore: false,
  online: true,
  syncing: false,
  syncError: null,
  revision: 0,
};

export const useWorkoutStore = create<WorkoutState>((set, get) => {
  /** server/outbox 를 바꾸고 화면용 목록을 다시 계산한다 */
  const commit = (
    patch: Partial<Pick<WorkoutState, 'server' | 'outbox'>> & Partial<WorkoutState>
  ) => {
    const next = { ...get(), ...patch };
    set({ ...patch, workouts: applyOutbox(next.server, next.outbox) });
  };

  const persistOutbox = () => {
    const { userId, outbox } = get();
    if (userId) void local.saveOutbox(userId, outbox);
  };

  const push = async (op: OpInput) => {
    commit({ outbox: enqueue(get().outbox, { ...op, opId: randomUUID() } as OutboxOp) });
    persistOutbox();
    void get().flush(); // 화면은 이미 반영됨. 서버 전송은 기다리지 않는다
  };

  return {
    ...INITIAL,

    load: async (userId) => {
      if (get().status === 'loading') return;
      set({ userId, status: 'loading', error: null });
      // 1) 기기에 있는 것부터 즉시 보여준다 (stale-while-revalidate)
      const [outbox, cached] = await Promise.all([
        local.loadOutbox(userId),
        local.loadWorkoutCache(userId),
      ]);
      if (cached.length > 0 || outbox.length > 0) {
        commit({ server: cached, outbox, status: 'success' });
      }
      // 2) 서버 최신 목록으로 교체
      try {
        const page = await workoutRepo.listWorkoutsPage();
        void local.saveWorkoutCache(userId, page.items);
        commit({
          server: page.items,
          outbox: get().outbox,
          hasMore: page.hasMore,
          status: 'success',
          online: true,
        });
      } catch (e) {
        if (!isNetworkError(e)) {
          if (get().status !== 'success') set({ status: 'error', error: errorMessage(e) });
          return;
        }
        // 오프라인: 캐시 + 대기 작업으로 계속 쓴다
        commit({
          server: cached,
          outbox: get().outbox,
          hasMore: false,
          status: 'success',
          online: false,
        });
      }
      void get().flush();
    },

    loadMore: async () => {
      const { hasMore, loadingMore, server, online } = get();
      if (!hasMore || loadingMore || !online || server.length === 0) return;
      set({ loadingMore: true });
      try {
        const page = await workoutRepo.listWorkoutsPage(server[server.length - 1].startedAt);
        commit({ server: mergePages(get().server, page.items), hasMore: page.hasMore });
      } catch (e) {
        if (isNetworkError(e)) set({ online: false });
      } finally {
        set({ loadingMore: false });
      }
    },

    flush: async () => {
      if (get().syncing || get().outbox.length === 0) return;
      set({ syncing: true });
      try {
        while (get().outbox.length > 0) {
          const op = get().outbox[0];
          try {
            await workoutRepo.pushOp(op);
            // 성공: 서버 목록에 확정 반영하고 큐에서 뺀다
            commit({
              server: applyOutbox(get().server, [op], { markPending: false }),
              outbox: get().outbox.filter((o) => o.opId !== op.opId),
              online: true,
              syncError: null,
              revision: get().revision + 1,
            });
          } catch (e) {
            if (isNetworkError(e)) {
              set({ online: false });
              break; // 연결이 돌아오면 다시 시도
            }
            // 재시도해도 안 될 작업(권한·검증 오류)은 버리고 알린다
            commit({
              outbox: get().outbox.filter((o) => o.opId !== op.opId),
              syncError: `일부 기록을 저장하지 못했어요: ${errorMessage(e)}`,
            });
          }
          persistOutbox();
        }
      } finally {
        set({ syncing: false });
        const { userId, server } = get();
        if (userId) void local.saveWorkoutCache(userId, server.slice(0, workoutRepo.PAGE_SIZE));
      }
    },

    setOnline: (online) => {
      const was = get().online;
      set({ online });
      if (online && !was) void get().flush();
    },

    start: async () => {
      const workoutId = randomUUID();
      await push({ kind: 'startWorkout', workoutId, startedAt: new Date().toISOString() });
      return workoutId;
    },

    finish: (workoutId) =>
      push({ kind: 'finishWorkout', workoutId, endedAt: new Date().toISOString() }),

    remove: (workoutId) => push({ kind: 'deleteWorkout', workoutId }),

    addSet: async (input) => {
      const workout = get().workouts.find((w) => w.id === input.workoutId);
      if (!workout) return;
      await push({
        kind: 'addSet',
        workoutId: input.workoutId,
        set: {
          id: randomUUID(),
          workoutId: input.workoutId,
          exerciseId: input.exerciseId,
          setIndex: nextSetIndex(workout.sets),
          weight: input.weight,
          reps: input.reps,
          createdAt: new Date().toISOString(),
        },
      });
    },

    removeSet: (workoutId, setId) => push({ kind: 'deleteSet', workoutId, setId }),

    reset: () => set({ ...INITIAL }),
  };
});
