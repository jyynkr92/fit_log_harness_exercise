import { Tabs } from 'expo-router';
import {
  BarChart3Icon,
  DumbbellIcon,
  HistoryIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react-native';
import type { ColorValue } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useWorkoutSync } from '@/features/workouts';

type TabIconProps = { color: ColorValue };

function TabIcon({ as, color }: TabIconProps & { as: LucideIcon }) {
  return <Icon as={as} size={22} color={String(color)} />;
}

const TodayIcon = (p: TabIconProps) => <TabIcon as={DumbbellIcon} {...p} />;
const HistoryTabIcon = (p: TabIconProps) => <TabIcon as={HistoryIcon} {...p} />;
const StatsIcon = (p: TabIconProps) => <TabIcon as={BarChart3Icon} {...p} />;
const ProfileIcon = (p: TabIconProps) => <TabIcon as={UserIcon} {...p} />;

export default function TabsLayout() {
  useWorkoutSync(); // 오프라인 아웃박스 재시도 (연결 복구·포그라운드·주기)
  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      <Tabs.Screen
        name="index"
        options={{ title: '오늘', tabBarButtonTestID: 'tab-today', tabBarIcon: TodayIcon }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: '기록', tabBarButtonTestID: 'tab-history', tabBarIcon: HistoryTabIcon }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: '통계', tabBarButtonTestID: 'tab-stats', tabBarIcon: StatsIcon }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '프로필', tabBarButtonTestID: 'tab-profile', tabBarIcon: ProfileIcon }}
      />
    </Tabs>
  );
}
