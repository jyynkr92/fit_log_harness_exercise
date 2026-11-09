export const EXERCISE_CATEGORIES = ['chest', 'back', 'legs', 'shoulders', 'arms', 'etc'] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  chest: '가슴',
  back: '등',
  legs: '하체',
  shoulders: '어깨',
  arms: '팔',
  etc: '기타',
};

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  isCustom: boolean;
};
