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
    sets: number; // Represents distance in km (1 set = 1 km)
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
    priority: number;
    weeklySets: number;
    muscleGroup: string;
    workout?: Set[];
    oneRepMax?: number;
}
