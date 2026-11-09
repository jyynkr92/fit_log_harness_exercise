export type WorkoutSet = {
  id: string;
  workoutId: string;
  exerciseId: string;
  setIndex: number;
  weight: number; // 항상 kg (표시 단위 변환은 lib/units)
  reps: number;
  createdAt: string;
  pending?: boolean; // 서버 동기화 대기 중
};

export type Workout = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  sets: WorkoutSet[];
  pending?: boolean;
};

export type NewSetInput = {
  workoutId: string;
  exerciseId: string;
  weight: number; // kg
  reps: number;
};

export type WorkoutSummary = {
  volume: number;
  setCount: number;
  exerciseCount: number;
  durationMs: number;
};

export type ExerciseSetGroup = {
  exerciseId: string;
  sets: WorkoutSet[];
};

/**
 * 오프라인 아웃박스 작업. id 는 클라이언트에서 만들기 때문에 모든 작업은 재시도해도 안전(멱등)하다.
 * docs/RELIABILITY.md "오프라인"
 */
export type OutboxOp =
  | { opId: string; kind: 'startWorkout'; workoutId: string; startedAt: string }
  | { opId: string; kind: 'finishWorkout'; workoutId: string; endedAt: string }
  | { opId: string; kind: 'deleteWorkout'; workoutId: string }
  | { opId: string; kind: 'addSet'; workoutId: string; set: Omit<WorkoutSet, 'pending'> }
  | { opId: string; kind: 'deleteSet'; workoutId: string; setId: string };

export type SyncState = {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  lastError: string | null;
};

export type WorkoutPage = { items: Workout[]; hasMore: boolean };
