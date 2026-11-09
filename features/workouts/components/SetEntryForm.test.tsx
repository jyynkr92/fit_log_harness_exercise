import { fireEvent, render, screen } from '@testing-library/react-native';

import { useUnitStore } from '@/lib/units';

import { SetEntryForm } from './SetEntryForm';

const setup = async (suggestion = { weight: 60, reps: 8 }) => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  await render(
    <SetEntryForm exerciseName="벤치프레스" suggestion={suggestion} onSubmit={onSubmit} />
  );
  return { onSubmit };
};

describe('SetEntryForm', () => {
  beforeEach(() => useUnitStore.setState({ unit: 'kg' }));

  test('prefills suggestion and submits kg', async () => {
    const { onSubmit } = await setup();
    expect(screen.getByTestId('weight-input').props.value).toBe('60');
    expect(screen.getByTestId('reps-input').props.value).toBe('8');

    await fireEvent.press(screen.getByTestId('weight-input-inc'));
    await fireEvent.press(screen.getByTestId('reps-input-dec'));
    expect(screen.getByTestId('weight-input').props.value).toBe('62.5');

    await fireEvent.press(screen.getByTestId('add-set-button'));
    expect(onSubmit).toHaveBeenCalledWith({ weight: 62.5, reps: 7 });
  });

  test('stepper does not go below minimum', async () => {
    await setup({ weight: 0, reps: 1 });
    await fireEvent.press(screen.getByTestId('weight-input-dec'));
    await fireEvent.press(screen.getByTestId('reps-input-dec'));
    expect(screen.getByTestId('weight-input').props.value).toBe('0');
    expect(screen.getByTestId('reps-input').props.value).toBe('1');
  });

  test('shows validation error and does not submit', async () => {
    const { onSubmit } = await setup();
    await fireEvent.changeText(screen.getByTestId('reps-input'), '0');
    await fireEvent.press(screen.getByTestId('add-set-button'));
    expect(screen.getByTestId('set-form-error')).toHaveTextContent('횟수는 1 이상이어야 합니다.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('lb: shows converted value, steps by 5 and submits kg', async () => {
    useUnitStore.setState({ unit: 'lb' });
    const { onSubmit } = await setup({ weight: 61.23, reps: 5 }); // ≈ 135 lb
    expect(screen.getByText('무게 (lb)')).toBeTruthy();
    expect(screen.getByTestId('weight-input').props.value).toBe('135');

    await fireEvent.press(screen.getByTestId('weight-input-inc'));
    expect(screen.getByTestId('weight-input').props.value).toBe('140');

    await fireEvent.press(screen.getByTestId('add-set-button'));
    expect(onSubmit).toHaveBeenCalledWith({ weight: 63.5, reps: 5 });
  });
});
