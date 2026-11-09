import { CloudOffIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import type { SyncState } from '../types';

/** 오프라인 / 동기화 대기 / 동기화 실패 안내. 정상 상태에서는 아무것도 그리지 않는다. */
export function SyncBanner({ state }: { state: SyncState }) {
  const { online, syncing, pendingCount, lastError } = state;

  if (lastError) {
    return (
      <View
        testID="sync-banner"
        className="flex-row items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
        <Icon as={TriangleAlertIcon} className="size-4 text-destructive" />
        <Text className="flex-1 text-sm text-destructive">{lastError}</Text>
      </View>
    );
  }
  if (!online) {
    return (
      <View
        testID="sync-banner"
        className="flex-row items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <Icon as={CloudOffIcon} className="size-4 text-muted-foreground" />
        <Text className="flex-1 text-sm text-muted-foreground">
          오프라인이에요.{' '}
          {pendingCount > 0
            ? `기록 ${pendingCount}건은 연결되면 자동으로 저장돼요.`
            : '기록은 기기에 저장되고 연결되면 동기화돼요.'}
        </Text>
      </View>
    );
  }
  if (pendingCount > 0) {
    return (
      <View
        testID="sync-banner"
        className="flex-row items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <Icon as={RefreshCwIcon} className="size-4 text-muted-foreground" />
        <Text className="flex-1 text-sm text-muted-foreground">
          {syncing ? '동기화 중' : '동기화 대기'} · {pendingCount}건
        </Text>
      </View>
    );
  }
  return null;
}
