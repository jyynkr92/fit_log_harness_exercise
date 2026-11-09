import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { WorkoutListSchema, WorkoutRowSchema, WorkoutSetRowSchema } from '../schema/workout';
import type { NewSetInput, Workout, WorkoutSet } from '../types';

const SET_COLUMNS = 'id, workout_id, exercise_id, set_index, weight, reps, created_at';
const WORKOUT_COLUMNS = `id, started_at, ended_at, note, workout_sets (${SET_COLUMNS})`;

export async function listWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_COLUMNS)
    .order('started_at', { ascending: false });
  if (error) throw toAppError(error, '운동 기록을 불러오지 못했습니다.');
  return WorkoutListSchema.parse(data);
}

export async function startWorkout(): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .insert({})
    .select(WORKOUT_COLUMNS)
    .single();
  if (error) throw toAppError(error, '운동을 시작하지 못했습니다.');
  return WorkoutRowSchema.parse(data);
}

export async function finishWorkout(id: string, endedAt: string): Promise<void> {
  const { error } = await supabase.from('workouts').update({ ended_at: endedAt }).eq('id', id);
  if (error) throw toAppError(error, '운동을 종료하지 못했습니다.');
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw toAppError(error, '운동을 삭제하지 못했습니다.');
}

export async function addSet(input: NewSetInput & { setIndex: number }): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from('workout_sets')
    .insert({
      workout_id: input.workoutId,
      exercise_id: input.exerciseId,
      set_index: input.setIndex,
      weight: input.weight,
      reps: input.reps,
    })
    .select(SET_COLUMNS)
    .single();
  if (error) throw toAppError(error, '세트를 저장하지 못했습니다.');
  return WorkoutSetRowSchema.parse(data);
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from('workout_sets').delete().eq('id', id);
  if (error) throw toAppError(error, '세트를 삭제하지 못했습니다.');
}
