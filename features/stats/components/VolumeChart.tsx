import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { formatVolume } from '@/lib/format';
import { cn } from '@/lib/utils';

import type { VolumeBucket } from '../types';

/**
 * 막대 차트 (View 기반, 의존성 없음).
 * 차트 라이브러리 선택은 design-doc 결정 전까지 보류 (docs/DESIGN.md "미정").
 */
export function VolumeChart({ buckets }: { buckets: VolumeBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.volume));
  const dense = buckets.length > 6;
  const peak = buckets.reduce((best, b) => (b.volume > best.volume ? b : best), buckets[0]);

  return (
    <View className="gap-2">
      <View className="h-40 flex-row items-end gap-1">
        {buckets.map((b) => (
          <View key={b.key} className="h-full flex-1 justify-end">
            <View
              accessibilityLabel={`${b.label} ${formatVolume(b.volume)}`}
              className={cn('w-full rounded-t-md', b.volume > 0 ? 'bg-primary' : 'bg-muted')}
              style={{ height: `${Math.max(2, (b.volume / max) * 100)}%` }}
            />
          </View>
        ))}
      </View>
      <View className="flex-row gap-1">
        {buckets.map((b, i) => (
          <Text
            key={b.key}
            numberOfLines={1}
            className="flex-1 text-center text-[10px] text-muted-foreground">
            {!dense || i % 2 === 0 ? b.label : ''}
          </Text>
        ))}
      </View>
      {peak && peak.volume > 0 ? (
        <Text className="text-xs text-muted-foreground">
          최고: {peak.label} {formatVolume(peak.volume)}
        </Text>
      ) : null}
    </View>
  );
}
