// models/Exercise.ts
export interface Exercise {
    id: string;
    name: string;
    description: string;
    setsPerWeek: number;
    category: string;
}
export interface ExerciseHistoryEntry {
    date: Date;
    sets: number;
    reps: number;
    weight: number;
}
