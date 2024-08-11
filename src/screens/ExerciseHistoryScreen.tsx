// ExerciseHistoryScreen.tsx
import React from "react";
import { View, Text } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ExerciseHistoryScreenRouteProp } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import StrengthHistoryScreen from "./exerciseHistory/StrengthHistoryScreen";
import EnduranceHistoryScreen from "./exerciseHistory/EnduranceHistoryScreen";
import MobilityHistoryScreen from "./exerciseHistory/MobilityHistoryScreen";
import NSunsHistoryScreen from "./exerciseHistory/NSunsHistoryScreen";

const ExerciseHistoryScreen = () => {
    const route = useRoute<ExerciseHistoryScreenRouteProp>();
    const { exerciseId } = route.params;
    const { exercises } = useExerciseContext();

    const exercise = exercises.find((e) => e.id === exerciseId);

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    switch (exercise.category) {
        case "strength":
            return <StrengthHistoryScreen exerciseId={exerciseId} />;
        case "endurance":
            return <EnduranceHistoryScreen exerciseId={exerciseId} />;
        case "mobility":
            return <MobilityHistoryScreen exerciseId={exerciseId} />;
        case "nsuns":
            return <NSunsHistoryScreen exerciseId={exerciseId} />;

        default:
            return <Text>Unknown exercise category</Text>;
    }
};

export default ExerciseHistoryScreen;
