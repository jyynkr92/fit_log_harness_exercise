import { useRouter } from 'expo-router';
import { HistoryIcon } from 'lucide-react-native';
import { FlatList, RefreshControl } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';

import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutCard } from './WorkoutCard';

export function HistoryScreen() {
  const router = useRouter();
  const { workouts, status, error, reload } = useWorkouts();

  if (status === 'idle' || (status === 'loading' && workouts.length === 0)) {
    return <LoadingState rows={4} />;
  }
  if (status === 'error') return <ErrorState message={error ?? '오류'} onRetry={reload} />;
  if (workouts.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="아직 기록이 없어요"
        description="오늘 탭에서 첫 운동을 시작해 보세요."
      />
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 p-4"
      data={workouts}
      keyExtractor={(w) => w.id}
      refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={reload} />}
      renderItem={({ item }) => (
        <WorkoutCard workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
      )}
    />
  );
}
