// contexts/ExerciseContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect,
    useCallback,
} from "react";
import { Exercise, ExerciseHistoryEntry } from "../models/Exercise";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ExerciseContextType {
    exercises: Exercise[];
    addExercise: (exercise: Exercise) => void;
    deleteExercise: (exerciseId: string) => void;
    exerciseHistory: Record<string, ExerciseHistoryEntry[]>;
    addExerciseToHistory: (exerciseId: string, entry: ExerciseHistoryEntry) => void;
    updateExerciseHistoryEntry: (
        exerciseId: string,
        entryIndex: number,
        updatedEntry: ExerciseHistoryEntry
    ) => void;
    deleteExerciseHistoryEntry: (exerciseId: string, entryIndex: number) => void;
    updateExercise: (id: string, updatedExercise: Omit<Exercise, "id">) => void;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export const ExerciseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [exerciseHistory, setExerciseHistory] = useState<Record<string, ExerciseHistoryEntry[]>>(
        {}
    );

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        saveData();
    }, [exercises, exerciseHistory]);

    const loadData = async () => {
        try {
            const storedExercises = await AsyncStorage.getItem("exercises");
            const storedHistory = await AsyncStorage.getItem("exerciseHistory");
            if (storedExercises) {
                setExercises(JSON.parse(storedExercises));
            }
            if (storedHistory) {
                setExerciseHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    const saveData = useCallback(async () => {
        try {
            await AsyncStorage.setItem("exercises", JSON.stringify(exercises));
            await AsyncStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
        } catch (error) {
            console.error("Error saving data:", error);
        }
    }, [exercises, exerciseHistory]);

    const addExercise = useCallback((exercise: Exercise) => {
        setExercises((prevExercises) => [...prevExercises, exercise]);
    }, []);

    const deleteExercise = useCallback((id: string) => {
        setExercises((prevExercises) => prevExercises.filter((exercise) => exercise.id !== id));
    }, []);

    const addExerciseToHistory = useCallback((exerciseId: string, entry: ExerciseHistoryEntry) => {
        setExerciseHistory((prevHistory) => ({
            ...prevHistory,
            [exerciseId]: [...(prevHistory[exerciseId] || []), entry],
        }));
    }, []);

    const updateExerciseHistoryEntry = useCallback(
        (exerciseId: string, entryIndex: number, updatedEntry: ExerciseHistoryEntry) => {
            setExerciseHistory((prevHistory) => ({
                ...prevHistory,
                [exerciseId]: prevHistory[exerciseId].map((entry, index) =>
                    index === entryIndex ? updatedEntry : entry
                ),
            }));
        },
        []
    );

    const deleteExerciseHistoryEntry = useCallback((exerciseId: string, entryIndex: number) => {
        setExerciseHistory((prevHistory) => ({
            ...prevHistory,
            [exerciseId]: prevHistory[exerciseId].filter((_, index) => index !== entryIndex),
        }));
    }, []);

    const updateExercise = useCallback((id: string, updatedExercise: Omit<Exercise, "id">) => {
        setExercises((prevExercises) =>
            prevExercises.map((exercise) =>
                exercise.id === id ? { ...exercise, ...updatedExercise } : exercise
            )
        );
    }, []);

    return (
        <ExerciseContext.Provider
            value={{
                exercises,
                addExercise,
                deleteExercise,
                exerciseHistory,
                addExerciseToHistory,
                updateExerciseHistoryEntry,
                deleteExerciseHistoryEntry,
                updateExercise,
            }}
        >
            {children}
        </ExerciseContext.Provider>
    );
};

export const useExerciseContext = () => {
    const context = useContext(ExerciseContext);
    if (context === undefined) {
        throw new Error("useExerciseContext must be used within an ExerciseProvider");
    }
    return context;
};
