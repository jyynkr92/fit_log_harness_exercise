import type { OutboxOp, Workout } from '../types';
import { applyOutbox, enqueue, mergePages } from './outbox';

const w = (id: string, startedAt: string, extra: Partial<Workout> = {}): Workout => ({
  id,
  startedAt,
  endedAt: null,
  note: null,
  sets: [],
  ...extra,
});
const set = (id: string, workoutId: string, setIndex = 0) => ({
  id,
  workoutId,
  exerciseId: 'bench',
  setIndex,
  weight: 50,
  reps: 5,
  createdAt: '2026-11-09T10:00:00Z',
});
let n = 0;
const op = <T extends Omit<OutboxOp, 'opId'>>(o: T) => ({ ...o, opId: `op${n++}` }) as OutboxOp;

describe('enqueue', () => {
  test('appends ordinary ops', () => {
    const ops = enqueue([], op({ kind: 'startWorkout', workoutId: 'w1', startedAt: 'x' }));
    expect(ops).toHaveLength(1);
  });

  test('deleting an unsynced set cancels its addSet', () => {
    const add = op({ kind: 'addSet', workoutId: 'w1', set: set('s1', 'w1') });
    const ops = enqueue([add], op({ kind: 'deleteSet', workoutId: 'w1', setId: 's1' }));
    expect(ops).toEqual([]);
  });

  test('deleting a synced set queues deleteSet', () => {
    const ops = enqueue([], op({ kind: 'deleteSet', workoutId: 'w1', setId: 's9' }));
    expect(ops.map((o) => o.kind)).toEqual(['deleteSet']);
  });

  test('deleting a never-synced workout drops all of its ops', () => {
    const ops = [
      op({ kind: 'startWorkout', workoutId: 'w1', startedAt: 'x' }),
      op({ kind: 'addSet', workoutId: 'w1', set: set('s1', 'w1') }),
      op({ kind: 'addSet', workoutId: 'w2', set: set('s2', 'w2') }),
    ];
    const next = enqueue(ops, op({ kind: 'deleteWorkout', workoutId: 'w1' }));
    expect(next.map((o) => o.workoutId)).toEqual(['w2']);
  });

  test('deleting a synced workout replaces its ops with deleteWorkout', () => {
    const ops = [op({ kind: 'addSet', workoutId: 'w1', set: set('s1', 'w1') })];
    const next = enqueue(ops, op({ kind: 'deleteWorkout', workoutId: 'w1' }));
    expect(next.map((o) => o.kind)).toEqual(['deleteWorkout']);
  });
});

describe('applyOutbox', () => {
  const server = [w('old', '2026-11-01T10:00:00Z', { sets: [set('a', 'old')] })];

  test('adds pending workout and sets on top of server data', () => {
    const view = applyOutbox(server, [
      op({ kind: 'startWorkout', workoutId: 'new', startedAt: '2026-11-09T10:00:00Z' }),
      op({ kind: 'addSet', workoutId: 'new', set: set('s1', 'new') }),
    ]);
    expect(view.map((x) => x.id)).toEqual(['new', 'old']);
    expect(view[0].pending).toBe(true);
    expect(view[0].sets[0]).toMatchObject({ id: 's1', pending: true });
  });

  test('finish, deleteSet and deleteWorkout', () => {
    const view = applyOutbox(server, [
      op({ kind: 'finishWorkout', workoutId: 'old', endedAt: '2026-11-01T11:00:00Z' }),
      op({ kind: 'deleteSet', workoutId: 'old', setId: 'a' }),
    ]);
    expect(view[0]).toMatchObject({ endedAt: '2026-11-01T11:00:00Z', sets: [] });
    expect(applyOutbox(server, [op({ kind: 'deleteWorkout', workoutId: 'old' })])).toEqual([]);
  });

  test('is idempotent when server already has the item', () => {
    const synced = applyOutbox(server, [
      op({ kind: 'addSet', workoutId: 'old', set: set('a', 'old') }),
    ]);
    expect(synced[0].sets).toHaveLength(1);
    expect(synced[0].sets[0].pending).toBeUndefined();
  });

  test('markPending=false applies ops as confirmed', () => {
    const view = applyOutbox(
      [],
      [op({ kind: 'startWorkout', workoutId: 'n', startedAt: '2026-11-09T10:00:00Z' })],
      { markPending: false }
    );
    expect(view[0].pending).toBeUndefined();
  });
});

test('mergePages dedupes and keeps newest first', () => {
  const a = [w('2', '2026-11-02T00:00:00Z'), w('1', '2026-11-01T00:00:00Z')];
  const b = [w('1', '2026-11-01T00:00:00Z'), w('0', '2026-10-31T00:00:00Z')];
  expect(mergePages(a, b).map((x) => x.id)).toEqual(['2', '1', '0']);
});
