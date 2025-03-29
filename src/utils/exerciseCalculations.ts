import { subDays, isAfter, differenceInDays } from "date-fns";
import {
    Exercise,
    ExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    EnduranceExerciseHistoryEntry,
} from "../contexts/Exercise";

const DECAY_START_FRACTION = 3 / 4; // When decay begins
const DECAY_LENGTH_FRACTION = 1 / 2; // Length of decay period
const TOTAL_PERIOD_FRACTION = DECAY_START_FRACTION + DECAY_LENGTH_FRACTION; // 5/4

// Calculate weight for a set performed 't' days ago
const calculateWeight = (daysAgo: number, trainingInterval: number): number => {
    const decayStart = DECAY_START_FRACTION * trainingInterval;
    const decayLength = DECAY_LENGTH_FRACTION * trainingInterval;
    const decayEnd = decayStart + decayLength; // Equal to TOTAL_PERIOD_FRACTION * trainingInterval

    if (daysAgo <= decayStart) return 1;
    if (daysAgo >= decayEnd) return 0;

    // Linear decay between decayStart and decayEnd
    return 1 - (daysAgo - decayStart) / decayLength;
};

export const calculateRemainingSets = (
    exercise: Exercise,
    exerciseHistory: Record<string, ExerciseHistoryEntry[]>,
    trainingInterval: number
): number => {
    const today = new Date();
    const decayEnd = subDays(today, Math.ceil(TOTAL_PERIOD_FRACTION * trainingInterval));

    const history = exerciseHistory[exercise.id] || [];
    const effectiveSets = history.reduce((total, entry: ExerciseHistoryEntry) => {
        const entryDate = new Date(entry.date);
        if (isAfter(entryDate, decayEnd)) {
            const daysAgo = differenceInDays(today, entryDate);
            const weight = calculateWeight(daysAgo, trainingInterval);

            let sets = 0;
            if (entry.category === "strength") {
                sets = (entry as StrengthExerciseHistoryEntry).sets;
            } else if (entry.category === "mobility") {
                sets = (entry as MobilityExerciseHistoryEntry).sets;
            } else if (entry.category === "endurance") {
                sets = (entry as EnduranceExerciseHistoryEntry).sets;
            }

            return total + sets * weight;
        }
        return total;
    }, 0);

    const remainingSets = exercise.weeklySets - effectiveSets;

    return Math.round(remainingSets);
};
