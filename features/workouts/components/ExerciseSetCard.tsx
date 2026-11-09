import { CloudUploadIcon, XIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useWeightFormat } from '@/lib/units';
import { cn } from '@/lib/utils';

import { totalVolume } from '../service/workoutMath';
import type { WorkoutSet } from '../types';

type Props = {
  exerciseName: string;
  sets: WorkoutSet[];
  selected?: boolean;
  onPress?: () => void;
  onRemoveSet?: (setId: string) => void;
};

export function ExerciseSetCard({ exerciseName, sets, selected, onPress, onRemoveSet }: Props) {
  const { fmtWeight, fmtVolume } = useWeightFormat();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={cn(
        'gap-2 rounded-xl border border-border bg-card p-4',
        selected && 'border-primary'
      )}>
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold">{exerciseName}</Text>
        <Text className="text-xs text-muted-foreground">
          {sets.length}세트 · {fmtVolume(totalVolume(sets))}
        </Text>
      </View>
      {sets.map((s, i) => (
        <View key={s.id} className="flex-row items-center gap-3">
          <Text className="w-6 text-sm text-muted-foreground">{i + 1}</Text>
          <Text className={cn('flex-1 text-base', s.pending && 'opacity-60')}>
            {fmtWeight(s.weight)} × {s.reps}회
          </Text>
          {s.pending ? (
            <View accessible accessibilityLabel="동기화 대기">
              <Icon as={CloudUploadIcon} className="size-4 text-muted-foreground" />
            </View>
          ) : null}
          {onRemoveSet ? (
            <Pressable
              hitSlop={12}
              accessibilityLabel={`${i + 1}세트 삭제`}
              onPress={() => onRemoveSet(s.id)}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-accent">
              <Icon as={XIcon} className="size-4 text-muted-foreground" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </Pressable>
  );
}
