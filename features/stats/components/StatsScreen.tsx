import { BarChart3Icon, TrophyIcon } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/screen-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useExerciseLookup } from '@/features/exercises';
import { formatDate, formatNumber, formatVolume } from '@/lib/format';
import { cn } from '@/lib/utils';

import { useStats } from '../hooks/useStats';
import { PERIOD_LABEL, PERIODS } from '../types';
import { VolumeChart } from './VolumeChart';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 rounded-xl border border-border bg-card p-4">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-2xl font-bold">{value}</Text>
    </View>
  );
}

export function StatsScreen() {
  const { overview, buckets, bests, hasAny, period, setPeriod, status, error, reload } = useStats();
  const lookup = useExerciseLookup();

  if (status === 'idle' || status === 'loading') return <LoadingState rows={3} />;
  if (status === 'error') return <ErrorState message={error ?? '오류'} onRetry={reload} />;
  if (!hasAny) {
    return (
      <EmptyState
        icon={BarChart3Icon}
        title="통계를 보려면 운동을 기록하세요"
        description="세트를 기록하면 볼륨, 추정 1RM, 연속 기록을 보여드려요."
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-12">
      <View className="flex-row rounded-lg bg-muted p-1">
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            testID={`period-${p}`}
            className={cn(
              'min-h-10 flex-1 items-center justify-center rounded-md',
              period === p && 'bg-background'
            )}>
            <Text
              className={cn('text-sm', period === p ? 'font-semibold' : 'text-muted-foreground')}>
              {PERIOD_LABEL[p]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Metric label="운동 횟수" value={`${overview.sessions}회`} />
        <Metric label="총 볼륨" value={formatVolume(overview.volume)} />
        <Metric
          label="주당 평균"
          value={
            overview.sessions > 0 && overview.avgSessionsPerWeek < 0.1
              ? '0.1회 미만'
              : `${formatNumber(overview.avgSessionsPerWeek, 1)}회`
          }
        />
        <Metric label="연속 운동" value={`${overview.streakWeeks}주`} />
      </View>

      <Card>
        <CardHeader>
          <CardTitle>{period === '1y' ? '월별 볼륨' : '주별 볼륨'}</CardTitle>
        </CardHeader>
        <CardContent>
          <VolumeChart buckets={buckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>종목별 최고 기록 (추정 1RM)</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {bests.length === 0 ? (
            <Text className="text-muted-foreground">이 기간에는 기록이 없어요.</Text>
          ) : (
            bests.slice(0, 8).map((b, i) => (
              <View key={b.exerciseId} className="flex-row items-center gap-3">
                {i === 0 ? (
                  <Icon as={TrophyIcon} className="size-4 text-primary" />
                ) : (
                  <Text className="w-4 text-center text-xs text-muted-foreground">{i + 1}</Text>
                )}
                <View className="flex-1">
                  <Text className="font-medium">
                    {lookup.get(b.exerciseId)?.name ?? '알 수 없는 종목'}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatNumber(b.weight, 2)}kg × {b.reps}회 · {formatDate(b.date)}
                  </Text>
                </View>
                <Text className="font-semibold">{formatNumber(b.e1rm, 1)}kg</Text>
              </View>
            ))
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
