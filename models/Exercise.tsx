// models/Exercise.ts
export interface Exercise {
    id: string;
    name: string;
    description: string;
    weeklySets: number;
    targetRPE: number;
    category: string;
    muscleGroup: string;
}
export interface ExerciseHistoryEntry {
    date: Date;
    sets: number;
    reps: number;
    weight: number;
    rpe: number;
}
