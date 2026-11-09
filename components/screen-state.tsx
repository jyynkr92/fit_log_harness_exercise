import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';

/** 화면 4상태 중 loading / error / empty 공통 UI (docs/FRONTEND.md "화면 상태 규약") */

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <View className="gap-3 p-4" accessibilityLabel="불러오는 중">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <Text className="text-center text-destructive">{message}</Text>
      {onRetry ? (
        <Button variant="outline" onPress={onRetry}>
          <Text>다시 시도</Text>
        </Button>
      ) : null}
    </View>
  );
}

export function EmptyState(props: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <View className="rounded-full bg-muted p-4">
        <Icon as={props.icon} className="size-8 text-muted-foreground" />
      </View>
      <Text className="text-lg font-semibold">{props.title}</Text>
      {props.description ? (
        <Text className="text-center text-muted-foreground">{props.description}</Text>
      ) : null}
      {props.action}
    </View>
  );
}
