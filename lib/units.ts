import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { formatNumber } from '@/lib/format';

/**
 * 무게 단위 (kg/lb). DB 는 항상 kg 로 저장하고, 표시·입력에서만 변환한다.
 * 단위는 기기 설정(테마와 같은 교차 관심사)이라 lib/ 에 둔다.
 */
export type WeightUnit = 'kg' | 'lb';
export const KG_PER_LB = 0.45359237;
export const WEIGHT_STEP: Record<WeightUnit, number> = { kg: 2.5, lb: 5 };

const round = (v: number, digits: number) => Math.round(v * 10 ** digits) / 10 ** digits;

/** kg → 표시 단위 (lb 는 소수 1자리) */
export const toDisplayWeight = (kg: number, unit: WeightUnit) =>
  unit === 'kg' ? round(kg, 2) : round(kg / KG_PER_LB, 1);

/** 표시 단위 → kg (DB numeric(6,2) 에 맞춰 소수 2자리) */
export const fromDisplayWeight = (value: number, unit: WeightUnit) =>
  unit === 'kg' ? round(value, 2) : round(value * KG_PER_LB, 2);

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${formatNumber(toDisplayWeight(kg, unit), unit === 'kg' ? 2 : 1)}${unit}`;
}

export function formatVolume(kg: number, unit: WeightUnit): string {
  const v = unit === 'kg' ? kg : kg / KG_PER_LB;
  if (v >= 10000)
    return unit === 'kg' ? `${formatNumber(v / 1000, 1)}t` : `${formatNumber(v / 1000, 1)}k lb`;
  return `${formatNumber(v)}${unit}`;
}

type UnitState = { unit: WeightUnit; setUnit: (u: WeightUnit) => void };

export const useUnitStore = create<UnitState>()(
  persist((set) => ({ unit: 'kg', setUnit: (unit) => set({ unit }) }), {
    name: 'fitlog.settings.unit',
    storage: createJSONStorage(() => AsyncStorage),
  })
);

/** 화면에서 쓰는 단위 포맷터 묶음 */
export function useWeightFormat() {
  const unit = useUnitStore((s) => s.unit);
  return useMemo(
    () => ({
      unit,
      step: WEIGHT_STEP[unit],
      fmtWeight: (kg: number) => formatWeight(kg, unit),
      fmtVolume: (kg: number) => formatVolume(kg, unit),
      toDisplay: (kg: number) => toDisplayWeight(kg, unit),
      fromDisplay: (v: number) => fromDisplayWeight(v, unit),
    }),
    [unit]
  );
}
