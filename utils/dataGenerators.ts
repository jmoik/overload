// utils/dataGenerators.ts
import { Exercise, ExerciseHistoryEntry } from "../models/Exercise";

export const generateRandomWorkoutData = (exercise: Exercise): ExerciseHistoryEntry[] => {
    const entries: ExerciseHistoryEntry[] = [];
    const numberOfEntries = Math.floor(Math.random() * 3) + 2; // Generate 5-14 entries

    for (let i = 1; i < numberOfEntries; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i * Math.round(Math.random() * 3));

        if (exercise.category === "endurance") {
            // cast to EnduranceExerciseHistoryEntry
            entries.push({
                date: date,
                distance: Math.floor(Math.random() * 5) + 1, // 1-6 km
                time: Math.floor(Math.random() * 60) + 20, // 20-80 min
                avgHeartRate: Math.floor(Math.random() * 50) + 100, // 100-150 bpm
                rpe: Math.floor(Math.random() * 3) + 7,
                category: "endurance",
                id: "",
                notes: "",
            });
            continue;
        } else if (exercise.category === "mobility") {
            // cast to MobilityExerciseHistoryEntry
            entries.push({
                date: date,
                sets: Math.floor(Math.random() * 2) + 1, // 1-3 sets
                rpe: Math.floor(Math.random() * 3) + 5,
                category: "mobility",
                id: "",
                notes: "",
            });
        } else if (exercise.category === "strength") {
            // cast to StrengthExerciseHistoryEntry
            entries.push({
                date: date,
                sets: Math.floor(Math.random() * 3) + 1, // 1-4 sets
                reps: Math.floor(Math.random() * 5) + 5, // 5-9 reps
                weight: Math.floor(Math.random() * 10) * 5 + 20, // 20-70 kg
                rpe: Math.floor(Math.random() * 3) + 7,
                category: "strength",
                id: "",
                notes: "",
            });
        } else if (exercise.category === "nsuns") {
            // cast to StrengthExerciseHistoryEntry
            entries.push({
                date: date,
                sets: Math.floor(Math.random() * 3) + 1, // 1-4 sets
                reps: Math.floor(Math.random() * 5) + 5, // 5-9 reps
                weight: Math.floor(Math.random() * 10) * 5 + 20, // 20-70 kg
                rpe: Math.floor(Math.random() * 3) + 7,
                category: "strength",
                id: "",
                notes: "",
            });
        }
    }

    return entries;
};
