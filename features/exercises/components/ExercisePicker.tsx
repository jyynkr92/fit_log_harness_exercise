import { PlusIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

import { useAddExercise, useExercises } from '../hooks/useExercises';
import { CATEGORY_LABEL, EXERCISE_CATEGORIES, type Exercise } from '../types';

type Props = {
  onSelect: (exercise: Exercise) => void;
  selectedId?: string | null;
};

/** 부위별 종목 칩 + 검색 + 직접 추가 */
export function ExercisePicker({ onSelect, selectedId }: Props) {
  const { exercises, status, error, reload } = useExercises();
  const addExercise = useAddExercise();
  const [query, setQuery] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = query.trim();
    const filtered = q ? exercises.filter((e) => e.name.includes(q)) : exercises;
    return EXERCISE_CATEGORIES.map((c) => ({
      category: c,
      items: filtered.filter((e) => e.category === c),
    })).filter((g) => g.items.length > 0);
  }, [exercises, query]);

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View className="items-start gap-2">
        <Text className="text-destructive">{error}</Text>
        <Button variant="outline" size="sm" onPress={reload}>
          <Text>다시 시도</Text>
        </Button>
      </View>
    );
  }

  const canAdd = query.trim().length > 0 && !exercises.some((e) => e.name === query.trim());

  return (
    <View className="gap-3">
      <Input
        value={query}
        onChangeText={(t) => (setQuery(t), setAddError(null))}
        placeholder="종목 검색 또는 새 종목 이름"
        testID="exercise-search"
      />
      {canAdd ? (
        <Button
          variant="outline"
          onPress={async () => {
            try {
              const created = await addExercise(query, 'etc');
              setQuery('');
              onSelect(created);
            } catch (e) {
              setAddError(errorMessage(e));
            }
          }}>
          <Icon as={PlusIcon} className="size-4" />
          <Text>‘{query.trim()}’ 새 종목으로 추가</Text>
        </Button>
      ) : null}
      {addError ? <Text className="text-sm text-destructive">{addError}</Text> : null}
      {grouped.length === 0 && !canAdd ? (
        <Text className="text-muted-foreground">검색 결과가 없습니다.</Text>
      ) : null}
      {grouped.map((g) => (
        <View key={g.category} className="gap-2">
          <Text className="text-xs font-medium text-muted-foreground">
            {CATEGORY_LABEL[g.category]}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {g.items.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => onSelect(e)}
                className={cn(
                  'min-h-11 justify-center rounded-full border border-border px-4 active:bg-accent',
                  selectedId === e.id && 'border-primary bg-primary'
                )}>
                <Text className={cn('text-sm', selectedId === e.id && 'text-primary-foreground')}>
                  {e.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
