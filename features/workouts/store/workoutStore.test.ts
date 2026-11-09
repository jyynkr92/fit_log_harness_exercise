import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppError } from '@/lib/errors';

import * as workoutRepo from '../repo/workoutRepo';
import { useWorkoutStore } from './workoutStore';

/** 오프라인 아웃박스 통합 테스트: repo(서버)만 목으로 바꾸고 스토어 로직은 실제로 돈다 */
jest.mock('../repo/workoutRepo', () => ({
  PAGE_SIZE: 20,
  listWorkoutsPage: jest.fn(),
  listWorkoutsSince: jest.fn(),
  pushOp: jest.fn(),
}));
let mockUuid = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `00000000-0000-4000-8000-${String(++mockUuid).padStart(12, '0')}`,
}));

const repo = workoutRepo as jest.Mocked<typeof workoutRepo>;
const offline = () => new AppError('네트워크 오류', 'network');
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

beforeEach(async () => {
  jest.resetAllMocks(); // 구현까지 초기화 (테스트 간 목 누수 방지)
  await AsyncStorage.clear(); // 아웃박스가 기기 저장소에 남아 다음 테스트로 새지 않게
  useWorkoutStore.getState().reset();
});

test('records offline, keeps pending ops, then syncs in order when back online', async () => {
  repo.listWorkoutsPage.mockRejectedValue(offline());
  repo.pushOp.mockRejectedValue(offline());

  await useWorkoutStore.getState().load('user-1');
  expect(useWorkoutStore.getState()).toMatchObject({ status: 'success', online: false });

  const workoutId = await useWorkoutStore.getState().start();
  await useWorkoutStore.getState().addSet({ workoutId, exerciseId: 'ex-1', weight: 60, reps: 8 });
  await useWorkoutStore.getState().addSet({ workoutId, exerciseId: 'ex-1', weight: 60, reps: 7 });
  await flushPromises();

  let s = useWorkoutStore.getState();
  expect(s.outbox.map((o) => o.kind)).toEqual(['startWorkout', 'addSet', 'addSet']);
  expect(s.workouts[0]).toMatchObject({ id: workoutId, pending: true });
  expect(s.workouts[0].sets.map((x) => [x.setIndex, x.reps, x.pending])).toEqual([
    [0, 8, true],
    [1, 7, true],
  ]);

  // 연결 복구
  repo.pushOp.mockResolvedValue(undefined);
  useWorkoutStore.getState().setOnline(true);
  await flushPromises();
  await useWorkoutStore.getState().flush();

  s = useWorkoutStore.getState();
  expect(repo.pushOp.mock.calls.map(([op]) => op.kind)).toEqual(
    expect.arrayContaining(['startWorkout', 'addSet', 'addSet'])
  );
  expect(s.outbox).toEqual([]);
  expect(s.online).toBe(true);
  expect(s.workouts[0].pending).toBeUndefined();
  expect(s.workouts[0].sets.every((x) => !x.pending)).toBe(true);
  expect(s.revision).toBeGreaterThanOrEqual(3);
});

test('deleting an unsynced set never reaches the server', async () => {
  repo.listWorkoutsPage.mockResolvedValue({ items: [], hasMore: false });
  repo.pushOp.mockRejectedValue(offline());
  await useWorkoutStore.getState().load('user-1');

  const workoutId = await useWorkoutStore.getState().start();
  await useWorkoutStore.getState().addSet({ workoutId, exerciseId: 'ex-1', weight: 50, reps: 5 });
  await flushPromises();
  const setId = useWorkoutStore.getState().workouts[0].sets[0].id;
  await useWorkoutStore.getState().removeSet(workoutId, setId);
  await flushPromises();

  expect(useWorkoutStore.getState().outbox.map((o) => o.kind)).toEqual(['startWorkout']);
  expect(useWorkoutStore.getState().workouts[0].sets).toEqual([]);
});

test('non-network errors drop the op and surface a message', async () => {
  repo.listWorkoutsPage.mockResolvedValue({ items: [], hasMore: false });
  repo.pushOp.mockRejectedValueOnce(new AppError('권한 없음', 'unknown'));
  await useWorkoutStore.getState().load('user-1');

  await useWorkoutStore.getState().start();
  await flushPromises();

  const s = useWorkoutStore.getState();
  expect(s.outbox).toEqual([]);
  expect(s.syncError).toMatch(/권한 없음/);
});

test('loadMore appends the next page using a cursor', async () => {
  const w = (id: string, day: number) => ({
    id,
    startedAt: new Date(2026, 9, day).toISOString(),
    endedAt: new Date(2026, 9, day, 1).toISOString(),
    note: null,
    sets: [],
  });
  repo.listWorkoutsPage
    .mockResolvedValueOnce({ items: [w('b', 20), w('a', 19)], hasMore: true })
    .mockResolvedValueOnce({ items: [w('z', 1)], hasMore: false });

  await useWorkoutStore.getState().load('user-1');
  await useWorkoutStore.getState().loadMore();

  expect(repo.listWorkoutsPage).toHaveBeenLastCalledWith(w('a', 19).startedAt);
  expect(useWorkoutStore.getState().workouts.map((x) => x.id)).toEqual(['b', 'a', 'z']);
  expect(useWorkoutStore.getState().hasMore).toBe(false);
});
