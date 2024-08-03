// src/utils/utils.ts

// import crypto from "crypto";
import { Exercise } from "../models/Exercise";

export function generateExerciseId(exercise: Omit<Exercise, "id">): string {
    const data = JSON.stringify(exercise);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36); // Convert to base 36 (numbers + letters)
}
