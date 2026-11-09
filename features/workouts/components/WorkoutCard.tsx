import { ChevronRightIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useExerciseLookup } from '@/features/exercises';
import { formatDate, formatDuration, formatTime, formatVolume } from '@/lib/format';

import { groupSetsByExercise, summarizeWorkout } from '../service/workoutMath';
import type { Workout } from '../types';

export function WorkoutCard({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  const lookup = useExerciseLookup();
  const summary = summarizeWorkout(workout);
  const names = groupSetsByExercise(workout.sets).map(
    (g) => lookup.get(g.exerciseId)?.name ?? '알 수 없는 종목'
  );

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4 active:bg-accent">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-semibold">{formatDate(workout.startedAt)}</Text>
          <Text className="text-xs text-muted-foreground">{formatTime(workout.startedAt)}</Text>
          {workout.endedAt === null ? (
            <Badge>
              <Text>진행 중</Text>
            </Badge>
          ) : null}
        </View>
        <Text className="text-sm text-muted-foreground">
          {formatDuration(summary.durationMs)} · {summary.setCount}세트 ·{' '}
          {formatVolume(summary.volume)}
        </Text>
        {names.length > 0 ? (
          <Text className="text-sm" numberOfLines={1}>
            {names.join(', ')}
          </Text>
        ) : (
          <Text className="text-sm text-muted-foreground">기록된 세트 없음</Text>
        )}
      </View>
      <Icon as={ChevronRightIcon} className="size-5 text-muted-foreground" />
    </Pressable>
  );
}
