import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '페이지 없음' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background p-6">
        <Text>존재하지 않는 화면입니다.</Text>
        <Link href="/">
          <Text className="text-primary underline">홈으로</Text>
        </Link>
      </View>
    </>
  );
}
