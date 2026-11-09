import { WeeklySummaryCard } from '@/features/stats';
import { TodayScreen } from '@/features/workouts';

export default function TodayRoute() {
  return <TodayScreen weeklySummary={<WeeklySummaryCard />} />;
}
