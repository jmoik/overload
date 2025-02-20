// src/data/suggestedPlans.ts

import { Exercise } from "../contexts/Exercise";
import { generateExerciseId } from "../utils/utils";
import { Set } from "../contexts/Exercise";

export const weeklyVolumePerMuscleGroup: { [key: string]: number } = {
    Legs: 20,
    Push: 20,
    Pull: 20,
    Core: 12,
    Arms: 12,
    Shoulders: 12,
    Hips: 12,
    "Lower Legs": 12,
};

export interface Plan {
    name: string;
    exercises: Exercise[];
}

// Calculate sets based on priority
function calculateWeeklySets(muscleGroup: string, priority: number, exercises: Exercise[]): number {
    const totalVolume = weeklyVolumePerMuscleGroup[muscleGroup] || 12;
    const exercisesInGroup = exercises.filter((e) => e.muscleGroup === muscleGroup);
    const totalPriority = exercisesInGroup.reduce((sum, e) => sum + e.priority, 0);
    return Math.round((priority / totalPriority) * totalVolume);
}

// Update createExercise to calculate weeklySets
function createExercise(
    exerciseData: Omit<Exercise, "id">,
    allExercises: Omit<Exercise, "id">[]
): Exercise {
    const weeklySets = calculateWeeklySets(
        exerciseData.muscleGroup,
        exerciseData.priority,
        allExercises as Exercise[]
    );

    return {
        ...exerciseData,
        id: generateExerciseId(exerciseData),
        weeklySets,
    };
}
export const suggestedPlans: { [key: string]: Plan } = {
    bodybuilding: {
        name: "Bodybuilding",
        exercises: (() => {
            const exerciseDataList = [
                {
                    name: "Romanian Deadlift",
                    description: "",
                    priority: 3,
                    category: "strength" as const,
                    muscleGroup: "Legs",
                },
                {
                    name: "Leg Press",
                    description: "",
                    priority: 2,
                    category: "strength" as const,
                    muscleGroup: "Legs",
                },
                {
                    name: "Hip Thrust",
                    description: "",
                    priority: 1,
                    category: "strength" as const,
                    muscleGroup: "Legs",
                },
                {
                    name: "Incline Bench",
                    description: "",
                    priority: 3,
                    category: "strength" as const,
                    muscleGroup: "Push",
                },
                {
                    name: "Overhead Press",
                    description: "",
                    priority: 2,
                    category: "strength" as const,
                    muscleGroup: "Push",
                },
                {
                    name: "Pull Up",
                    description: "",
                    priority: 3,
                    category: "strength" as const,
                    muscleGroup: "Pull",
                },
            ];

            return exerciseDataList.map((data) => createExercise(data, exerciseDataList));
        })(),
    },
};
