// models/Exercise.ts

export type ExerciseCategory = "strength" | "endurance" | "mobility" | "other";

export interface Exercise {
    id: string;
    name: string;
    description: string;
    weeklySets: number;
    targetRPE: number;
    category: ExerciseCategory;
    muscleGroup: string;
}
export interface ExerciseHistoryEntry {
    date: Date;
    sets: number;
    reps: number;
    weight: number;
    rpe: number;
}
