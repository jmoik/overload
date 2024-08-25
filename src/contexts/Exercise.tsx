// models/Exercise.ts

export interface BaseExerciseHistoryEntry {
    id: string;
    date: Date;
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

export type Set = {
    reps: number;
    relativeWeight: number;
    isAMRAP: boolean;
};

export type ExerciseHistoryEntry =
    | StrengthExerciseHistoryEntry
    | EnduranceExerciseHistoryEntry
    | MobilityExerciseHistoryEntry;

export interface Exercise {
    id: string;
    name: string;
    category: "strength" | "endurance" | "mobility" | "nsuns";
    description: string;
    weeklySets: number;
    muscleGroup: string;
    distance?: number;
    workout?: Set[];
    oneRepMax?: number;
}
