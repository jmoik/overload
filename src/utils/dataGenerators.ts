// utils/dataGenerators.ts
import {
    Exercise,
    ExerciseHistoryEntry,
    EnduranceExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../contexts/Exercise";
import { generateEntryId } from "./utils";

export const generateRandomWorkoutData = (exercise: Exercise): ExerciseHistoryEntry[] => {
    const entries: ExerciseHistoryEntry[] = [];
    const numberOfEntries = Math.floor(Math.random() * 10) + 5; // Generate 5-14 entries

    for (let i = 1; i < numberOfEntries; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i * Math.round(Math.random() * 3));

        let entry: Omit<ExerciseHistoryEntry, "id">;

        if (exercise.category === "endurance") {
            entry = {
                date: date,
                distance: Math.floor(Math.random() * 5) + 1, // 1-6 km
                time: Math.floor(Math.random() * 60) + 20, // 20-80 min
                avgHeartRate: Math.floor(Math.random() * 50) + 100, // 100-150 bpm
                category: "endurance",
                notes: "",
            } as Omit<EnduranceExerciseHistoryEntry, "id">;
        } else if (exercise.category === "mobility") {
            entry = {
                date: date,
                sets: Math.floor(Math.random() * 2) + 1, // 1-3 sets
                category: "mobility",
                notes: "",
            } as Omit<MobilityExerciseHistoryEntry, "id">;
        } else {
            // This covers both "strength" and "nsuns" categories
            entry = {
                date: date,
                sets: Math.floor(Math.random() * 3) + 1, // 1-4 sets
                reps: Math.floor(Math.random() * 5) + 5, // 5-9 reps
                weight: Math.floor(Math.random() * 10) * 5 + 20, // 20-70 kg
                category: "strength",
                notes: "",
            } as Omit<StrengthExerciseHistoryEntry, "id">;
        }

        const entryWithId = {
            ...entry,
            id: generateEntryId(entry),
        };

        entries.push(entryWithId as ExerciseHistoryEntry);
    }

    return entries;
};
