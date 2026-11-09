import { useRouter } from 'expo-router';
import { PlayIcon, TimerIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/screen-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatDuration } from '@/lib/format';
import { useWeightFormat } from '@/lib/units';
import { useNow } from '@/lib/useNow';

import {
  useActiveWorkout,
  useSyncState,
  useWorkoutActions,
  useWorkouts,
} from '../hooks/useWorkouts';
import { summarizeWorkout } from '../service/workoutMath';
import { SyncBanner } from './SyncBanner';
import { WorkoutCard } from './WorkoutCard';

/** 오늘 탭: 운동 시작/이어하기 + 최근 기록 */
export function TodayScreen({ weeklySummary }: { weeklySummary?: React.ReactNode }) {
  const router = useRouter();
  const { workouts, status, error, reload } = useWorkouts();
  const active = useActiveWorkout();
  const { start } = useWorkoutActions();
  const now = useNow(30_000, active !== null);
  const [starting, setStarting] = useState(false);
  const { fmtVolume } = useWeightFormat();
  const sync = useSyncState();

  if (status === 'idle' || (status === 'loading' && workouts.length === 0)) return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? '오류'} onRetry={reload} />;

  const onStart = async () => {
    setStarting(true);
    try {
      const id = await start();
      router.push(`/workout/${id}`);
    } catch (e) {
      Alert.alert('운동 시작 실패', errorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  const recent = workouts.filter((w) => w.endedAt !== null).slice(0, 3);
  const activeSummary = active ? summarizeWorkout(active, now) : null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-12">
      <Text className="text-muted-foreground">{formatDate(new Date(now).toISOString())}</Text>
      <SyncBanner state={sync} />

      {active && activeSummary ? (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>진행 중인 운동</CardTitle>
            <CardDescription>
              {formatDuration(activeSummary.durationMs)} 경과 · {activeSummary.setCount}세트 ·{' '}
              {fmtVolume(activeSummary.volume)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              onPress={() => router.push(`/workout/${active.id}`)}
              testID="continue-workout-button">
              <Icon as={TimerIcon} className="size-4 text-primary-foreground" />
              <Text>이어서 기록하기</Text>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>오늘 운동할 준비 되셨나요?</CardTitle>
            <CardDescription>
              시작하면 시간이 기록되고 세트를 바로 추가할 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onPress={onStart} disabled={starting} testID="start-workout-button">
              <Icon as={PlayIcon} className="size-4 text-primary-foreground" />
              <Text>{starting ? '시작하는 중…' : '운동 시작'}</Text>
            </Button>
          </CardContent>
        </Card>
      )}

      {weeklySummary}

      <View className="gap-3">
        <Text className="text-lg font-semibold">최근 운동</Text>
        {recent.length === 0 ? (
          <Text className="text-muted-foreground">완료한 운동이 아직 없어요.</Text>
        ) : (
          recent.map((w) => (
            <WorkoutCard key={w.id} workout={w} onPress={() => router.push(`/workout/${w.id}`)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
