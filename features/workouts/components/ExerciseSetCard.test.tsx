import { fireEvent, render, screen } from '@testing-library/react-native';

import { useUnitStore } from '@/lib/units';

import type { WorkoutSet } from '../types';
import { ExerciseSetCard } from './ExerciseSetCard';
import { SyncBanner } from './SyncBanner';

const set = (id: string, setIndex: number, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id,
  workoutId: 'w1',
  exerciseId: 'bench',
  setIndex,
  weight: 100,
  reps: 5,
  createdAt: '2026-11-09T10:00:00Z',
  ...extra,
});

describe('ExerciseSetCard', () => {
  beforeEach(() => useUnitStore.setState({ unit: 'kg' }));

  test('lists sets with volume and pending marker', async () => {
    await render(
      <ExerciseSetCard
        exerciseName="벤치프레스"
        sets={[set('a', 0), set('b', 1, { pending: true })]}
      />
    );
    expect(screen.getByText('2세트 · 1,000kg')).toBeTruthy();
    expect(screen.getAllByText('100kg × 5회')).toHaveLength(2);
    expect(screen.getAllByLabelText('동기화 대기')).toHaveLength(1);
  });

  test('remove button reports set id', async () => {
    const onRemoveSet = jest.fn();
    await render(
      <ExerciseSetCard
        exerciseName="스쿼트"
        sets={[set('a', 0), set('b', 1)]}
        onRemoveSet={onRemoveSet}
      />
    );
    await fireEvent.press(screen.getByLabelText('2세트 삭제'));
    expect(onRemoveSet).toHaveBeenCalledWith('b');
  });

  test('renders in lb when unit is lb', async () => {
    useUnitStore.setState({ unit: 'lb' });
    await render(<ExerciseSetCard exerciseName="벤치프레스" sets={[set('a', 0)]} />);
    expect(screen.getByText('220.5lb × 5회')).toBeTruthy();
  });
});

describe('SyncBanner', () => {
  const base = { online: true, syncing: false, pendingCount: 0, lastError: null };

  test('renders nothing when synced', async () => {
    await render(<SyncBanner state={base} />);
    expect(screen.queryByTestId('sync-banner')).toBeNull();
  });

  test('offline with pending records', async () => {
    await render(<SyncBanner state={{ ...base, online: false, pendingCount: 2 }} />);
    expect(screen.getByTestId('sync-banner')).toHaveTextContent(
      /기록 2건은 연결되면 자동으로 저장돼요/
    );
  });

  test('online with pending shows sync progress', async () => {
    await render(<SyncBanner state={{ ...base, pendingCount: 3, syncing: true }} />);
    expect(screen.getByTestId('sync-banner')).toHaveTextContent('동기화 중 · 3건');
  });

  test('error wins over other states', async () => {
    await render(<SyncBanner state={{ ...base, online: false, lastError: '저장 실패' }} />);
    expect(screen.getByTestId('sync-banner')).toHaveTextContent('저장 실패');
  });
});
