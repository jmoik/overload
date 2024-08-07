// models/Exercise.ts

export interface BaseExerciseHistoryEntry {
    id: string;
    date: Date;
    rpe: number;
    notes: string;
}

export interface StrengthExerciseHistoryEntry extends BaseExerciseHistoryEntry {
    category: "strength";
    sets: number;
    reps: number;
    weight: number;
}

export interface EnduranceExerciseHistoryEntry extends BaseExerciseHistoryEntry {
    category: "endurance";
    distance: number;
    time: number;
    avgHeartRate?: number;
}

export interface MobilityExerciseHistoryEntry extends BaseExerciseHistoryEntry {
    category: "mobility";
    sets: number;
}

export interface NSunsExerciseHistoryEntry extends BaseExerciseHistoryEntry {
    category: "nsuns";
    setsArray: Set[];
}

export type Set = {
    reps: number;
    weight: number;
    rpe: number;
    notes?: string;
};

export type ExerciseHistoryEntry =
    | StrengthExerciseHistoryEntry
    | EnduranceExerciseHistoryEntry
    | MobilityExerciseHistoryEntry
    | NSunsExerciseHistoryEntry;

export interface Exercise {
    id: string;
    name: string;
    category: "strength" | "endurance" | "mobility" | "nsuns";
    description: string;
    weeklySets: number;
    targetRPE: number;
    muscleGroup: string;
    distance?: number;
    workout?: Set[]; // Add this line for nSuns exercises
}
