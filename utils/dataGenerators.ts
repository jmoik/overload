// utils/dataGenerators.ts
import { Exercise, ExerciseHistoryEntry } from "../models/Exercise";

export const generateRandomWorkoutData = (exercise: Exercise): ExerciseHistoryEntry[] => {
    const entries: ExerciseHistoryEntry[] = [];
    const numberOfEntries = Math.floor(Math.random() * 10) + 5; // Generate 5-14 entries

    for (let i = 1; i < numberOfEntries; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i * Math.round(Math.random() * 4));

        if (exercise.category === "endurance") {
            entries.push({
                date: date,
                distance: Math.floor(Math.random() * 5) + 1, // 1-6 km
                time: Math.floor(Math.random() * 60) + 20, // 20-80 min
                avgHeartRate: Math.floor(Math.random() * 50) + 100, // 100-150 bpm
                rpe: Math.floor(Math.random() * 3) + 7, // RPE 7-9
            });
            continue;
        } else {
            entries.push({
                date: date,
                sets: Math.floor(Math.random() * 3) + 2, // 2-4 sets
                reps: Math.floor(Math.random() * 8) + 5, // 5-12 reps
                weight: Math.floor(Math.random() * 50) + 50, // 50-100 kg
                rpe: Math.floor(Math.random() * 3) + 7, // RPE 7-9
            });
        }
    }

    return entries;
};
