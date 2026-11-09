import { Stack, useRouter } from 'expo-router';
import { SearchXIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ExercisePicker, useExerciseLookup, type Exercise } from '@/features/exercises';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatDuration, formatVolume } from '@/lib/format';
import { useNow } from '@/lib/useNow';

import { useWorkoutActions, useWorkoutByParam } from '../hooks/useWorkouts';
import { groupSetsByExercise, suggestNextSet, summarizeWorkout } from '../service/workoutMath';
import { ExerciseSetCard } from './ExerciseSetCard';
import { SetEntryForm } from './SetEntryForm';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text className="text-lg font-bold">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}

/** /workout/[id] — 운동 진행 및 상세 */
export function WorkoutSessionScreen({ id }: { id: unknown }) {
  const router = useRouter();
  const { workout, workouts, status, error, reload, invalidId } = useWorkoutByParam(id);
  const { addSet, removeSet, finish, remove } = useWorkoutActions();
  const lookup = useExerciseLookup();
  const isActive = workout?.endedAt === null;
  const now = useNow(30_000, isActive);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [picking, setPicking] = useState(false);

  const groups = useMemo(() => (workout ? groupSetsByExercise(workout.sets) : []), [workout]);
  const suggestion = useMemo(
    () => (workout && selected ? suggestNextSet(workouts, workout.id, selected.id) : null),
    [workouts, workout, selected]
  );

  if (status === 'idle' || status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? '오류'} onRetry={reload} />;
  if (invalidId || !workout) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="운동 기록을 찾을 수 없어요"
        action={
          <Button variant="outline" onPress={() => router.back()}>
            <Text>돌아가기</Text>
          </Button>
        }
      />
    );
  }

  const summary = summarizeWorkout(workout, now);
  const showPicker = picking || (isActive && !selected && groups.length === 0);

  const onFinish = async () => {
    try {
      await finish(workout.id);
      router.back();
    } catch (e) {
      Alert.alert('운동 종료 실패', errorMessage(e));
    }
  };

  const onDelete = () =>
    Alert.alert('운동 기록 삭제', '이 운동과 모든 세트를 삭제할까요? 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(workout.id);
            router.back();
          } catch (e) {
            Alert.alert('삭제 실패', errorMessage(e));
          }
        },
      },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: isActive ? '운동 중' : formatDate(workout.startedAt) }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-4 pb-16"
        keyboardShouldPersistTaps="handled">
        <View className="flex-row rounded-xl bg-muted py-4">
          <Stat label="시간" value={formatDuration(summary.durationMs)} />
          <Stat label="세트" value={String(summary.setCount)} />
          <Stat label="볼륨" value={formatVolume(summary.volume)} />
        </View>

        {groups.map((g) => {
          const exercise = lookup.get(g.exerciseId);
          return (
            <ExerciseSetCard
              key={g.exerciseId}
              exerciseName={exercise?.name ?? '알 수 없는 종목'}
              sets={g.sets}
              selected={isActive && selected?.id === g.exerciseId}
              onPress={
                isActive && exercise ? () => (setSelected(exercise), setPicking(false)) : undefined
              }
              onRemoveSet={(setId) =>
                removeSet(workout.id, setId).catch((e) => Alert.alert('삭제 실패', errorMessage(e)))
              }
            />
          );
        })}

        {isActive && selected && suggestion && !showPicker ? (
          <SetEntryForm
            key={selected.id}
            exerciseName={selected.name}
            suggestion={suggestion}
            onSubmit={(v) => addSet({ workoutId: workout.id, exerciseId: selected.id, ...v })}
          />
        ) : null}

        {isActive && showPicker ? (
          <View className="gap-3">
            <Text className="font-semibold">종목 선택</Text>
            <ExercisePicker
              selectedId={selected?.id}
              onSelect={(e) => (setSelected(e), setPicking(false))}
            />
          </View>
        ) : null}

        {isActive && !showPicker ? (
          <Button variant="outline" onPress={() => setPicking(true)} testID="pick-exercise-button">
            <Text>+ 다른 종목 추가</Text>
          </Button>
        ) : null}

        <View className="mt-4 gap-2">
          {isActive ? (
            <Button size="lg" onPress={onFinish} testID="finish-workout-button">
              <Text>운동 완료</Text>
            </Button>
          ) : null}
          <Button variant="ghost" onPress={onDelete}>
            <Text className="text-destructive">운동 기록 삭제</Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
