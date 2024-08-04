// types/navigation.ts
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Exercise } from "../models/Exercise";

export type RootStackParamList = {
    Home: undefined;
    RoutineList: undefined;
    AddExercise:
        | {
              exerciseId?: string;
              exerciseData?: Exercise;
              onSave?: (updatedExercise: Exercise) => void;
          }
        | undefined;
    ExerciseHistory: { exerciseId: string };
    OneRepMaxFormula: undefined;
    RestTimer: undefined;
    TrainingInterval: undefined;
    DefaultRpe: undefined;
    Welcome: undefined;
    PlanPreview: { plans: Array<{ name: string; exercises: Exercise[] }> };
    AppInfo: undefined;
};

export type AddExerciseScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "AddExercise"
>;

export type ExerciseHistoryScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "ExerciseHistory"
>;

export type RoutineScreenNavigationProp = StackNavigationProp<RootStackParamList, "RoutineList">;
export type AddExerciseScreenRouteProp = RouteProp<RootStackParamList, "AddExercise">;
export type ExerciseHistoryScreenRouteProp = RouteProp<RootStackParamList, "ExerciseHistory">;
export type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
