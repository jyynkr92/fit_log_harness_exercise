import { MinusIcon, PlusIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { errorMessage } from '@/lib/errors';

import { SetFormSchema } from '../schema/workout';
import { stepValue } from '../service/workoutMath';

type Props = {
  exerciseName: string;
  suggestion: { weight: number; reps: number };
  onSubmit: (value: { weight: number; reps: number }) => Promise<void>;
};

function Stepper(props: {
  label: string;
  unit: string;
  value: string;
  step: number;
  min: number;
  testID: string;
  onChange: (v: string) => void;
}) {
  const bump = (d: number) =>
    props.onChange(String(stepValue(Number(props.value) || 0, d, props.min)));
  return (
    <View className="flex-1 gap-1.5">
      <Text className="text-xs text-muted-foreground">
        {props.label} ({props.unit})
      </Text>
      <View className="flex-row items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12"
          onPress={() => bump(-props.step)}>
          <Icon as={MinusIcon} className="size-5" />
        </Button>
        <Input
          testID={props.testID}
          className="h-12 flex-1 text-center text-xl font-semibold"
          keyboardType="decimal-pad"
          value={props.value}
          onChangeText={props.onChange}
          selectTextOnFocus
        />
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12"
          onPress={() => bump(props.step)}>
          <Icon as={PlusIcon} className="size-5" />
        </Button>
      </View>
    </View>
  );
}

/**
 * 무게·횟수 입력. 지난 기록으로 프리필되고, 스테퍼로 빠르게 조정한다.
 * 종목이 바뀌면 부모가 key 로 리마운트해 초기값을 다시 잡는다.
 */
export function SetEntryForm({ exerciseName, suggestion, onSubmit }: Props) {
  const [weight, setWeight] = useState(String(suggestion.weight));
  const [reps, setReps] = useState(String(suggestion.reps));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const parsed = SetFormSchema.safeParse({ weight, reps });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '입력값을 확인하세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(parsed.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <Text className="font-semibold">{exerciseName}</Text>
      <View className="flex-row gap-3">
        <Stepper
          label="무게"
          unit="kg"
          value={weight}
          step={2.5}
          min={0}
          testID="weight-input"
          onChange={setWeight}
        />
        <Stepper
          label="횟수"
          unit="회"
          value={reps}
          step={1}
          min={1}
          testID="reps-input"
          onChange={setReps}
        />
      </View>
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button size="lg" onPress={submit} disabled={saving} testID="add-set-button">
        <Icon as={PlusIcon} className="size-4 text-primary-foreground" />
        <Text>세트 추가</Text>
      </Button>
    </View>
  );
}
