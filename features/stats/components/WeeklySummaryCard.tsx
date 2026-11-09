import { View } from 'react-native';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useWeightFormat } from '@/lib/units';

import { useStats } from '../hooks/useStats';

/** 오늘 탭에 끼워 넣는 이번 주 요약 (최근 4주 기준 연속 기록) */
export function WeeklySummaryCard() {
  const { buckets, overview, hasAny } = useStats('4w');
  const { fmtVolume } = useWeightFormat();
  if (!hasAny) return null;
  const thisWeek = buckets[buckets.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>이번 주</CardTitle>
      </CardHeader>
      <CardContent className="flex-row">
        {[
          ['운동', `${thisWeek?.sessions ?? 0}회`],
          ['볼륨', fmtVolume(thisWeek?.volume ?? 0)],
          ['연속', `${overview.streakWeeks}주`],
        ].map(([label, value]) => (
          <View key={label} className="flex-1 items-center gap-0.5">
            <Text className="text-xl font-bold">{value}</Text>
            <Text className="text-xs text-muted-foreground">{label}</Text>
          </View>
        ))}
      </CardContent>
    </Card>
  );
}
