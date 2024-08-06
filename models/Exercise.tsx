// models/Exercise.ts

export type ExerciseCategory = "strength" | "endurance" | "mobility" | "nsuns" | "other";

export interface Set {
    reps: number;
    weight: number;
    rpe: number;
    notes: string;
}

export interface Exercise {
    id: string;
    name: string;
    description: string;
    weeklySets: number;
    targetRPE: number;
    category: ExerciseCategory;
    muscleGroup: string;
    distance?: number;
}
export interface ExerciseHistoryEntry {
    date: Date;
    sets?: number;
    setsArray: Set[];
    reps?: number;
    weight?: number;
    rpe: number;
    distance?: number;
    time?: number;
    avgHeartRate?: number;
    notes: string;
}
