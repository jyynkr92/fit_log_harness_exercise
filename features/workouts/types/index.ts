export type WorkoutSet = {
  id: string;
  workoutId: string;
  exerciseId: string;
  setIndex: number;
  weight: number; // kg
  reps: number;
  createdAt: string;
};

export type Workout = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  sets: WorkoutSet[];
};

export type NewSetInput = {
  workoutId: string;
  exerciseId: string;
  weight: number;
  reps: number;
};

export type WorkoutSummary = {
  volume: number;
  setCount: number;
  exerciseCount: number;
  durationMs: number;
};

export type ExerciseSetGroup = {
  exerciseId: string;
  sets: WorkoutSet[];
};
