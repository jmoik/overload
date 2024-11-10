// contexts/RoutineContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Routine } from "./Routine";

interface RoutineContextType {
    routines: Routine[];
    addRoutine: (routine: Omit<Routine, "id" | "createdAt">) => Promise<void>;
    updateRoutine: (routine: Routine) => Promise<void>;
    deleteRoutine: (id: string) => Promise<void>;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider: React.FC = ({ children }) => {
    const [routines, setRoutines] = useState<Routine[]>([]);

    const addRoutine = useCallback(
        async (newRoutine: Omit<Routine, "id" | "createdAt">) => {
            const routine: Routine = {
                ...newRoutine,
                id: Date.now().toString(),
                createdAt: new Date(),
            };

            const updatedRoutines = [...routines, routine];
            setRoutines(updatedRoutines);
            await AsyncStorage.setItem("routines", JSON.stringify(updatedRoutines));
        },
        [routines]
    );

    const updateRoutine = useCallback(
        async (updatedRoutine: Routine) => {
            const updatedRoutines = routines.map((routine) =>
                routine.id === updatedRoutine.id ? updatedRoutine : routine
            );
            setRoutines(updatedRoutines);
            await AsyncStorage.setItem("routines", JSON.stringify(updatedRoutines));
        },
        [routines]
    );

    const deleteRoutine = useCallback(
        async (id: string) => {
            const updatedRoutines = routines.filter((routine) => routine.id !== id);
            setRoutines(updatedRoutines);
            await AsyncStorage.setItem("routines", JSON.stringify(updatedRoutines));
        },
        [routines]
    );

    return (
        <RoutineContext.Provider
            value={{
                routines,
                addRoutine,
                updateRoutine,
                deleteRoutine,
            }}
        >
            {children}
        </RoutineContext.Provider>
    );
};

export const useRoutineContext = () => {
    const context = useContext(RoutineContext);
    if (context === undefined) {
        throw new Error("useRoutineContext must be used within a RoutineProvider");
    }
    return context;
};
