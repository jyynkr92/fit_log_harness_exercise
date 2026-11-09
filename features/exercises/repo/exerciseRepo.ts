import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { ExerciseListSchema, ExerciseRowSchema } from '../schema/exercise';
import type { Exercise, ExerciseCategory } from '../types';

const COLUMNS = 'id, name, category, owner_id';

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select(COLUMNS).order('name');
  if (error) throw toAppError(error, '운동 종목을 불러오지 못했습니다.');
  return ExerciseListSchema.parse(data);
}

export async function createExercise(
  name: string,
  category: ExerciseCategory,
  ownerId: string
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, category, owner_id: ownerId })
    .select(COLUMNS)
    .single();
  if (error) {
    if (error.code === '23505') throw toAppError(null, '이미 있는 종목 이름입니다.');
    throw toAppError(error, '종목을 추가하지 못했습니다.');
  }
  return ExerciseRowSchema.parse(data);
}
