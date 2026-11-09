import { useLocalSearchParams } from 'expo-router';

import { WorkoutSessionScreen } from '@/features/workouts';

/** id 는 경계 입력이므로 WorkoutSessionScreen 내부에서 schema 로 파싱한다. */
export default function WorkoutRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkoutSessionScreen id={id} />;
}
