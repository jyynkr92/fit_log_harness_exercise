import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { WorkoutListSchema } from '../schema/workout';
import type { OutboxOp, Workout, WorkoutPage } from '../types';

const SET_COLUMNS = 'id, workout_id, exercise_id, set_index, weight, reps, created_at';
const WORKOUT_COLUMNS = `id, started_at, ended_at, note, workout_sets (${SET_COLUMNS})`;

export const PAGE_SIZE = 20;

/** 최신순 페이지. before 가 있으면 그 시각 이전 운동만 (커서 기반) */
export async function listWorkoutsPage(before?: string): Promise<WorkoutPage> {
  let query = supabase
    .from('workouts')
    .select(WORKOUT_COLUMNS)
    .order('started_at', { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (before) query = query.lt('started_at', before);
  const { data, error } = await query;
  if (error) throw toAppError(error, '운동 기록을 불러오지 못했습니다.');
  const items = WorkoutListSchema.parse(data);
  return { items: items.slice(0, PAGE_SIZE), hasMore: items.length > PAGE_SIZE };
}

/** 통계용: from 이후의 운동 전체 (기간이 최대 1년이라 페이지 없이 가져온다) */
export async function listWorkoutsSince(from: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_COLUMNS)
    .gte('started_at', from)
    .order('started_at', { ascending: false });
  if (error) throw toAppError(error, '통계 데이터를 불러오지 못했습니다.');
  return WorkoutListSchema.parse(data);
}

/**
 * 아웃박스 작업 하나를 서버에 반영한다. 모든 작업은 멱등:
 * insert 는 클라이언트 id + upsert(ignoreDuplicates), delete/update 는 원래 멱등.
 */
export async function pushOp(op: OutboxOp): Promise<void> {
  const run = async () => {
    switch (op.kind) {
      case 'startWorkout':
        return supabase
          .from('workouts')
          .upsert(
            { id: op.workoutId, started_at: op.startedAt },
            { onConflict: 'id', ignoreDuplicates: true }
          );
      case 'finishWorkout':
        return supabase.from('workouts').update({ ended_at: op.endedAt }).eq('id', op.workoutId);
      case 'deleteWorkout':
        return supabase.from('workouts').delete().eq('id', op.workoutId);
      case 'addSet':
        return supabase.from('workout_sets').upsert(
          {
            id: op.set.id,
            workout_id: op.workoutId,
            exercise_id: op.set.exerciseId,
            set_index: op.set.setIndex,
            weight: op.set.weight,
            reps: op.set.reps,
            created_at: op.set.createdAt,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      case 'deleteSet':
        return supabase.from('workout_sets').delete().eq('id', op.setId);
    }
  };
  const { error } = await run();
  if (error) throw toAppError(error, '기록을 서버에 저장하지 못했습니다.');
}
