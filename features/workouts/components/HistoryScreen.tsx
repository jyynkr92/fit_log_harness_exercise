import { useRouter } from 'expo-router';
import { HistoryIcon } from 'lucide-react-native';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';
import { Text } from '@/components/ui/text';

import { useSyncState, useWorkoutPaging, useWorkouts } from '../hooks/useWorkouts';
import { SyncBanner } from './SyncBanner';
import { WorkoutCard } from './WorkoutCard';

/** 기록 탭: 20개씩 무한 스크롤 (TD-001) */
export function HistoryScreen() {
  const router = useRouter();
  const { workouts, status, error, reload } = useWorkouts();
  const { hasMore, loadingMore, loadMore } = useWorkoutPaging();
  const sync = useSyncState();

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
      testID="history-list"
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 p-4"
      data={workouts}
      keyExtractor={(w) => w.id}
      refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={reload} />}
      ListHeaderComponent={<SyncBanner state={sync} />}
      onEndReachedThreshold={0.5}
      onEndReached={() => void loadMore()}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator className="py-4" />
        ) : !hasMore ? (
          <View className="items-center py-4">
            <Text className="text-xs text-muted-foreground">
              {sync.online ? `전체 ${workouts.length}개 기록` : '오프라인에서는 최근 기록만 보여요'}
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <WorkoutCard workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
      )}
    />
  );
}
