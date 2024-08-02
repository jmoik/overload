// contexts/ExerciseContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useEffect,
    useCallback,
    useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vibration } from "react-native";
import { Exercise, ExerciseHistoryEntry } from "../models/Exercise";

export type OneRepMaxFormula = "brzycki" | "epley" | "lander";

interface ExerciseContextType {
    exercises: Exercise[];
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
    addExercise: (exercise: Exercise) => void;
    deleteExercise: (exerciseId: string) => void;
    exerciseHistory: Record<string, ExerciseHistoryEntry[]>;
    setExerciseHistory: React.Dispatch<
        React.SetStateAction<Record<string, ExerciseHistoryEntry[]>>
    >;
    addExerciseToHistory: (exerciseId: string, entry: ExerciseHistoryEntry) => void;
    updateExerciseHistoryEntry: (
        exerciseId: string,
        entryIndex: number,
        updatedEntry: ExerciseHistoryEntry
    ) => void;
    deleteExerciseHistoryEntry: (exerciseId: string, entryIndex: number) => void;
    updateExercise: (id: string, updatedExercise: Omit<Exercise, "id">) => void;
    oneRepMaxFormula: OneRepMaxFormula;
    setOneRepMaxFormula: (formula: OneRepMaxFormula) => void;
    restTimerDuration: number;
    setRestTimerDuration: (duration: number) => void;
    timerRunning: boolean;
    timeLeft: number;
    startTimer: () => void;
    stopTimer: () => void;
    trainingInterval: number;
    setTrainingInterval: (interval: number) => void;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export const ExerciseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [exerciseHistory, setExerciseHistory] = useState<Record<string, ExerciseHistoryEntry[]>>(
        {}
    );
    const [oneRepMaxFormula, setOneRepMaxFormula] = useState<OneRepMaxFormula>("brzycki");
    const [restTimerDuration, setRestTimerDuration] = useState<number>(60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(restTimerDuration);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [trainingInterval, setTrainingInterval] = useState<number>(7);

    useEffect(() => {
        if (!timerRunning) {
            setTimeLeft(restTimerDuration);
        }
    }, [restTimerDuration, timerRunning]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startTimer = useCallback(() => {
        setTimerRunning(true);
        setTimeLeft(restTimerDuration);
        timerRef.current = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current!);
                    setTimerRunning(false);
                    Vibration.vibrate([0, 500, 200, 500]);
                    return restTimerDuration;
                }
                return prevTime - 1;
            });
        }, 1000);
    }, [restTimerDuration]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setTimerRunning(false);
        setTimeLeft(restTimerDuration);
    }, [restTimerDuration]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        saveData();
    }, [exercises, exerciseHistory, oneRepMaxFormula, restTimerDuration, trainingInterval]);

    const loadData = async () => {
        try {
            const storedExercises = await AsyncStorage.getItem("exercises");
            const storedHistory = await AsyncStorage.getItem("exerciseHistory");
            const storedFormula = await AsyncStorage.getItem("oneRepMaxFormula");
            const storedRestTimer = await AsyncStorage.getItem("restTimerDuration");
            const storedTrainingInterval = await AsyncStorage.getItem("trainingInterval");
            if (storedTrainingInterval) {
                setTrainingInterval(parseInt(storedTrainingInterval, 10));
            }
            if (storedExercises) {
                setExercises(JSON.parse(storedExercises));
            }
            if (storedHistory) {
                setExerciseHistory(JSON.parse(storedHistory));
            }
            if (
                storedFormula &&
                (storedFormula === "brzycki" ||
                    storedFormula === "epley" ||
                    storedFormula === "lander")
            ) {
                setOneRepMaxFormula(storedFormula);
            }
            if (storedRestTimer) {
                setRestTimerDuration(parseInt(storedRestTimer, 10));
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    const saveData = useCallback(async () => {
        try {
            await AsyncStorage.setItem("exercises", JSON.stringify(exercises));
            await AsyncStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
            await AsyncStorage.setItem("oneRepMaxFormula", oneRepMaxFormula);
            await AsyncStorage.setItem("restTimerDuration", restTimerDuration.toString());
            await AsyncStorage.setItem("trainingInterval", trainingInterval.toString());
        } catch (error) {
            console.error("Error saving data:", error);
        }
    }, [exercises, exerciseHistory, oneRepMaxFormula, restTimerDuration, trainingInterval]);

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
                setExercises,
                setExerciseHistory,
                addExercise,
                deleteExercise,
                exerciseHistory,
                addExerciseToHistory,
                updateExerciseHistoryEntry,
                deleteExerciseHistoryEntry,
                updateExercise,
                oneRepMaxFormula,
                setOneRepMaxFormula,
                restTimerDuration,
                setRestTimerDuration,
                timerRunning,
                timeLeft,
                startTimer,
                stopTimer,
                trainingInterval,
                setTrainingInterval,
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
