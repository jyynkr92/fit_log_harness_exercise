import type { OutboxOp, Workout } from '../types';

/**
 * 오프라인 아웃박스 순수 로직. I/O 없음.
 * - enqueue: 서로 상쇄되는 작업은 합친다 (아직 안 보낸 세트를 지우면 둘 다 사라짐)
 * - applyOutbox: 서버 목록 위에 대기 작업을 재생해 화면에 보여줄 목록을 만든다
 */

export function enqueue(ops: OutboxOp[], op: OutboxOp): OutboxOp[] {
  if (op.kind === 'deleteSet') {
    const pendingAdd = ops.find((o) => o.kind === 'addSet' && o.set.id === op.setId);
    if (pendingAdd) return ops.filter((o) => o !== pendingAdd);
  }
  if (op.kind === 'deleteWorkout') {
    const rest = ops.filter((o) => o.workoutId !== op.workoutId);
    const neverSynced = ops.some((o) => o.kind === 'startWorkout' && o.workoutId === op.workoutId);
    return neverSynced ? rest : [...rest, op];
  }
  return [...ops, op];
}

const byStartedDesc = (a: Workout, b: Workout) => Date.parse(b.startedAt) - Date.parse(a.startedAt);

/** ops 를 workouts 위에 순서대로 적용한다. markPending 이면 바뀐 항목에 pending 표시 */
export function applyOutbox(
  workouts: Workout[],
  ops: OutboxOp[],
  { markPending = true }: { markPending?: boolean } = {}
): Workout[] {
  let list = workouts;
  const patch = (id: string, fn: (w: Workout) => Workout) =>
    (list = list.map((w) => (w.id === id ? fn(w) : w)));

  for (const op of ops) {
    switch (op.kind) {
      case 'startWorkout':
        if (!list.some((w) => w.id === op.workoutId)) {
          list = [
            {
              id: op.workoutId,
              startedAt: op.startedAt,
              endedAt: null,
              note: null,
              sets: [],
              pending: markPending || undefined,
            },
            ...list,
          ];
        }
        break;
      case 'finishWorkout':
        patch(op.workoutId, (w) => ({ ...w, endedAt: op.endedAt }));
        break;
      case 'deleteWorkout':
        list = list.filter((w) => w.id !== op.workoutId);
        break;
      case 'addSet':
        patch(op.workoutId, (w) =>
          w.sets.some((s) => s.id === op.set.id)
            ? w
            : {
                ...w,
                sets: [...w.sets, { ...op.set, pending: markPending || undefined }].sort(
                  (a, b) => a.setIndex - b.setIndex
                ),
              }
        );
        break;
      case 'deleteSet':
        patch(op.workoutId, (w) => ({ ...w, sets: w.sets.filter((s) => s.id !== op.setId) }));
        break;
    }
  }
  return [...list].sort(byStartedDesc);
}

/** 페이지를 이어 붙인다 (id 중복 제거, 최신순 유지) */
export function mergePages(current: Workout[], next: Workout[]): Workout[] {
  const seen = new Set(current.map((w) => w.id));
  return [...current, ...next.filter((w) => !seen.has(w.id))].sort(byStartedDesc);
}
