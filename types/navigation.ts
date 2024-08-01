// types/navigation.ts
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

export type RootStackParamList = {
    MainTabs: undefined;
    AddExercise: { exerciseId?: string } | undefined;
    ExerciseHistory: { exerciseId: string };
    OneRepMaxFormula: undefined;
};

export type AddExerciseScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "AddExercise"
>;
export type ExerciseHistoryScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "ExerciseHistory"
>;

export type AddExerciseScreenRouteProp = RouteProp<RootStackParamList, "AddExercise">;
export type ExerciseHistoryScreenRouteProp = RouteProp<RootStackParamList, "ExerciseHistory">;
export type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, "MainTabs">;
