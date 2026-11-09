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

type TabIconProps = { color: ColorValue };

function TabIcon({ as, color }: TabIconProps & { as: LucideIcon }) {
  return <Icon as={as} size={22} color={String(color)} />;
}

const TodayIcon = (p: TabIconProps) => <TabIcon as={DumbbellIcon} {...p} />;
const HistoryTabIcon = (p: TabIconProps) => <TabIcon as={HistoryIcon} {...p} />;
const StatsIcon = (p: TabIconProps) => <TabIcon as={BarChart3Icon} {...p} />;
const ProfileIcon = (p: TabIconProps) => <TabIcon as={UserIcon} {...p} />;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      <Tabs.Screen name="index" options={{ title: '오늘', tabBarIcon: TodayIcon }} />
      <Tabs.Screen name="history" options={{ title: '기록', tabBarIcon: HistoryTabIcon }} />
      <Tabs.Screen name="stats" options={{ title: '통계', tabBarIcon: StatsIcon }} />
      <Tabs.Screen name="profile" options={{ title: '프로필', tabBarIcon: ProfileIcon }} />
    </Tabs>
  );
}
