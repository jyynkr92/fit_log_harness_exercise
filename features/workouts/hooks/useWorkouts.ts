import { useEffect, useMemo } from 'react';

import { useCurrentUser } from '@/features/auth';

import { WorkoutIdParamSchema } from '../schema/workout';
import { findActiveWorkout } from '../service/workoutMath';
import { useWorkoutStore } from '../store/workoutStore';

/** 로그인한 사용자의 운동 목록. 사용자가 바뀌면 다시 불러온다. */
export function useWorkouts() {
  const userId = useCurrentUser()?.id;
  const workouts = useWorkoutStore((s) => s.workouts);
  const status = useWorkoutStore((s) => s.status);
  const error = useWorkoutStore((s) => s.error);
  const load = useWorkoutStore((s) => s.load);
  const reset = useWorkoutStore((s) => s.reset);

  useEffect(() => {
    if (!userId) reset();
    else if (status === 'idle') load();
  }, [userId, status, load, reset]);

  return { workouts, status, error, reload: load };
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
