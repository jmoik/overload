// src/data/suggestedPlans.ts

import { Exercise } from "../contexts/Exercise";
import { generateExerciseId } from "../utils/utils";

export const weeklyVolumePerMuscleGroupPerCategory: {
    [category: string]: { [muscleGroup: string]: number };
} = {
    strength: {
        Arms: 8,
        Back: 20,
        Chest: 15,
        Core: 8,
        Legs: 20,
        Shoulders: 8,
        "Lower Legs": 4,
    },
    mobility: {
        "Upper Body": 20,
        "Lower Body": 30,
    },
    endurance: {
        "Full Body": 30,
    },
};

export const recalculateWeeklySets = (
    exercises: (Exercise & { isSelected: boolean })[],
    muscleGroup: string,
    category: string
) => {
    const activeExercises = exercises.filter(
        (e) => e.muscleGroup === muscleGroup && e.category === category && e.isSelected
    );

    const totalPriority = activeExercises.reduce(
        (sum, e) => sum + (e.priority > 0 ? e.priority : 0),
        0
    );

    const existingTotalSets = activeExercises.reduce((sum, e) => sum + (e.weeklySets || 0), 0);

    const totalVolume =
        existingTotalSets > 0
            ? existingTotalSets
            : weeklyVolumePerMuscleGroupPerCategory[category]?.[muscleGroup] || 12;

    if (!weeklyVolumePerMuscleGroupPerCategory[category]) {
        weeklyVolumePerMuscleGroupPerCategory[category] = {};
    }
    weeklyVolumePerMuscleGroupPerCategory[category][muscleGroup] = totalVolume;

    if (totalPriority === 0) {
        return exercises.map((e) => ({
            ...e,
            weeklySets: e.weeklySets || 5,
        }));
    }

    const updatedExercises = exercises.map((e) => ({
        ...e,
        weeklySets:
            e.isSelected && e.muscleGroup === muscleGroup && e.category === category
                ? e.priority > 0
                    ? Math.floor((e.priority / totalPriority) * totalVolume)
                    : 0
                : e.weeklySets || 0,
    }));

    const remainingSets =
        totalVolume -
        activeExercises.reduce(
            (sum, e) => sum + (updatedExercises.find((ue) => ue.id === e.id)?.weeklySets || 0),
            0
        );

    if (remainingSets > 0) {
        activeExercises
            .filter((e) => e.priority > 0)
            .map((e) => ({
                id: e.id,
                fraction:
                    (e.priority / totalPriority) * totalVolume -
                    (updatedExercises.find((ue) => ue.id === e.id)?.weeklySets || 0),
            }))
            .sort((a, b) => b.fraction - a.fraction)
            .slice(0, remainingSets)
            .forEach(({ id }) => {
                const idx = updatedExercises.findIndex((e) => e.id === id);
                if (idx !== -1) {
                    updatedExercises[idx].weeklySets++;
                }
            });
    }

    return updatedExercises;
};

export interface Plan {
    category: string;
    exercises: Exercise[];
}

// Updated createExercise to exclude weeklySets and set default priority to 1
function createExercise(exerciseData: Omit<Exercise, "id">): Exercise {
    return {
        ...exerciseData,
        priority: 1,
        id: generateExerciseId(exerciseData),
    };
}

export const suggestedPlans: { [key: string]: Plan } = {
    strength: {
        category: "strength",
        exercises: (() => {
            const exerciseDataList = [
                // Legs
                {
                    name: "Deadlift",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Squat",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Front Squat",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Leg Press",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Romanian Deadlift",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Split Squat",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Hip Thrust",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Leg Extension",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Leg Curl",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Hack Squat",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                {
                    name: "Step-Ups",
                    description: "",
                    category: "strength",
                    muscleGroup: "Legs",
                },
                // Chest
                {
                    name: "Bench Press",
                    description: "",
                    category: "strength",
                    muscleGroup: "Chest",
                },
                {
                    name: "Incline Bench Press",
                    description: "",
                    category: "strength",
                    muscleGroup: "Chest",
                },
                {
                    name: "Chest Fly",
                    description: "",
                    category: "strength",
                    muscleGroup: "Chest",
                },
                {
                    name: "Push-Ups",
                    description: "",
                    category: "strength",
                    muscleGroup: "Chest",
                },
                {
                    name: "Dips",
                    description: "",
                    category: "strength",
                    muscleGroup: "Chest",
                },
                // Back
                {
                    name: "Pull Up",
                    description: "",
                    category: "strength",
                    muscleGroup: "Back",
                },
                {
                    name: "Row",
                    description: "",
                    category: "strength",
                    muscleGroup: "Back",
                },
                {
                    name: "Lat Pulldown",
                    description: "",
                    category: "strength",
                    muscleGroup: "Back",
                },
                {
                    name: "Seated Row",
                    description: "",
                    category: "strength",
                    muscleGroup: "Back",
                },
                {
                    name: "T-Bar Row",
                    description: "",
                    category: "strength",
                    muscleGroup: "Back",
                },
                {
                    name: "Hyperextensions",
                    description: "",
                    category: "strength",
                    muscleGroup: "Back",
                },
                // Shoulders
                {
                    name: "Overhead Press",
                    description: "",
                    category: "strength",
                    muscleGroup: "Shoulders",
                },
                {
                    name: "Lateral Raise",
                    description: "",
                    category: "strength",
                    muscleGroup: "Shoulders",
                },
                {
                    name: "Rear Delt Fly",
                    description: "",
                    category: "strength",
                    muscleGroup: "Shoulders",
                },
                // Arms
                {
                    name: "Biceps Curl",
                    description: "",
                    category: "strength",
                    muscleGroup: "Arms",
                },
                {
                    name: "Tricep Extension",
                    description: "",
                    category: "strength",
                    muscleGroup: "Arms",
                },
                // Core
                {
                    name: "Plank",
                    description: "",
                    category: "strength",
                    muscleGroup: "Core",
                },
                {
                    name: "Leg Raise",
                    description: "",
                    category: "strength",
                    muscleGroup: "Core",
                },
                {
                    name: "Ab Roll",
                    description: "",
                    category: "strength",
                    muscleGroup: "Core",
                },
                {
                    name: "Crunches",
                    description: "",
                    category: "strength",
                    muscleGroup: "Core",
                },
                // Lower Legs
                {
                    name: "Calf Raise",
                    description: "",
                    category: "strength",
                    muscleGroup: "Lower Legs",
                },
                {
                    name: "Tibialis Raise",
                    description: "",
                    category: "strength",
                    muscleGroup: "Lower Legs",
                },
            ];
            return exerciseDataList.map((data) => createExercise(data));
        })(),
    },
    mobility: {
        category: "mobility",
        exercises: (() => {
            const exerciseDataList = [
                // Upper Body Exercises
                {
                    name: "Dead Hang",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                {
                    name: "Chest Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                {
                    name: "Cat-Cow Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                {
                    name: "Child's Pose",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                {
                    name: "Thoracic Rotations",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                {
                    name: "Cobra Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                {
                    name: "Seated Forward Bend",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                {
                    name: "Wrist Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Upper Body",
                },
                // Lower Body Exercises
                {
                    name: "Deep Squat",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Lower Body",
                },
                {
                    name: "ATG Split Squat",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Lower Body",
                },
                {
                    name: "Hamstring Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Lower Body",
                },
                {
                    name: "Pancake Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Lower Body",
                },
                {
                    name: "Pigeon Pose",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Lower Body",
                },
                {
                    name: "Ankle Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Lower Body",
                },
                {
                    name: "Quad Stretch",
                    description: "",
                    category: "mobility",
                    muscleGroup: "Lower Body",
                },
            ];
            return exerciseDataList.map((data) => createExercise(data));
        })(),
    },
    endurance: {
        category: "endurance",
        exercises: (() => {
            const exerciseDataList = [
                {
                    name: "Running",
                    description: "",
                    category: "endurance",
                    muscleGroup: "Full Body",
                },
                {
                    name: "Cycling",
                    description: "",
                    category: "endurance",
                    muscleGroup: "Full Body",
                },
                {
                    name: "Swimming",
                    description: "",
                    category: "endurance",
                    muscleGroup: "Full Body",
                },
                {
                    name: "Rowing Machine",
                    description: "",
                    category: "endurance",
                    muscleGroup: "Full Body",
                },
                {
                    name: "Stair Stepper",
                    description: "",
                    category: "endurance",
                    muscleGroup: "Full Body",
                },
            ];
            return exerciseDataList.map((data) => createExercise(data));
        })(),
    },
};
