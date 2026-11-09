import { LogOutIcon, UserIcon } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useCurrentUser, useSignOut } from '@/features/auth';
import { useWorkouts } from '@/features/workouts';
import { useUnitStore, type WeightUnit } from '@/lib/units';
import { cn } from '@/lib/utils';

const UNITS: WeightUnit[] = ['kg', 'lb'];

export function ProfileScreen() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const { workouts } = useWorkouts();
  const totalSets = workouts.reduce((n, w) => n + w.sets.length, 0);
  const unit = useUnitStore((s) => s.unit);
  const setUnit = useUnitStore((s) => s.setUnit);

  const onSignOut = () =>
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <Card>
        <CardContent className="flex-row items-center gap-4 pt-6">
          <View className="rounded-full bg-muted p-3">
            <Icon as={UserIcon} className="size-6 text-muted-foreground" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold">{user?.email ?? '이메일 없음'}</Text>
            <Text className="text-sm text-muted-foreground">
              총 {workouts.length}회 운동 · {totalSets}세트 기록
            </Text>
          </View>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="gap-3 pt-6">
          <View className="flex-row items-center justify-between">
            <Text>무게 단위</Text>
            <View className="flex-row rounded-lg bg-muted p-1">
              {UNITS.map((u) => (
                <Pressable
                  key={u}
                  testID={`unit-${u}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: unit === u }}
                  onPress={() => setUnit(u)}
                  className={cn(
                    'min-h-9 min-w-14 items-center justify-center rounded-md px-3',
                    unit === u && 'bg-background'
                  )}>
                  <Text
                    className={cn(
                      'text-sm',
                      unit === u ? 'font-semibold' : 'text-muted-foreground'
                    )}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Separator />
          <View className="flex-row justify-between">
            <Text>앱 버전</Text>
            <Text className="text-muted-foreground">1.0.0</Text>
          </View>
        </CardContent>
      </Card>
      <Button variant="outline" onPress={onSignOut}>
        <Icon as={LogOutIcon} className="size-4" />
        <Text>로그아웃</Text>
      </Button>
    </ScrollView>
  );
}
