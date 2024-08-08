// screens/SuggestedWorkoutScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SectionList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useExerciseContext } from "../contexts/ExerciseContext";
import {
    EnduranceExerciseHistoryEntry,
    Exercise,
    ExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../models/Exercise";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../styles/globalStyles";
import { isAfter, subDays } from "date-fns";

const SuggestedWorkoutScreen = () => {
    const { exercises, deleteExercise, exerciseHistory, trainingInterval, meanRpe } =
        useExerciseContext();
    const [suggestedWorkout, setSuggestedWorkout] = useState<
        { title: string; data: (Exercise & { suggestedSets?: number })[] }[]
    >([]);
    const navigation = useNavigation();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createStyles(currentTheme);

    useEffect(() => {
        generateWorkout();
    }, [exercises]);

    const calculateRemainingSets = useCallback(
        (exercise: Exercise) => {
            const today = new Date();
            const intervalStart = subDays(today, trainingInterval);

            const history = exerciseHistory[exercise.id] || [];
            const setsDoneInInterval = history.reduce((total, entry: ExerciseHistoryEntry) => {
                if (isAfter(new Date(entry.date), intervalStart)) {
                    if (entry.category === "strength") {
                        return total + (entry as StrengthExerciseHistoryEntry).sets;
                    } else if (entry.category === "mobility") {
                        return total + (entry as MobilityExerciseHistoryEntry).sets;
                    } else if (entry.category === "endurance") {
                        return total + (entry as EnduranceExerciseHistoryEntry).distance;
                    }
                }
                return total;
            }, 0);

            let remainingSets = exercise.weeklySets - setsDoneInInterval;

            if (exercise.category === "endurance") {
                remainingSets = exercise.weeklySets * (exercise.distance ?? 0) - setsDoneInInterval;
            }
            return remainingSets;
        },
        [exerciseHistory, trainingInterval]
    );

    const generateWorkout = () => {
        const enduranceExercises = exercises
            .filter(
                (exercise) =>
                    exercise.category === "endurance" && calculateRemainingSets(exercise) > 0
            )
            .sort((a, b) => calculateRemainingSets(b) - calculateRemainingSets(a));

        const strengthExercises = exercises
            .filter(
                (exercise) =>
                    exercise.category === "strength" && calculateRemainingSets(exercise) > 0
            )
            .sort((a, b) => calculateRemainingSets(b) - calculateRemainingSets(a));

        const nSunsExercises = exercises
            .filter(
                (exercise) => exercise.category === "nsuns" && calculateRemainingSets(exercise) > 0
            )
            .sort((a, b) => calculateRemainingSets(b) - calculateRemainingSets(a));

        const mobilityExercises = exercises
            .filter(
                (exercise) =>
                    exercise.category === "mobility" && calculateRemainingSets(exercise) > 0
            )
            .sort((a, b) => calculateRemainingSets(b) - calculateRemainingSets(a));

        const enduranceWorkout = enduranceExercises.slice(0, 1).map((exercise) => ({
            ...exercise,
            suggestedSets: Math.min(
                Math.max(4, Math.floor(((exercise.distance ?? 0) / trainingInterval) * 3)),
                calculateRemainingSets(exercise)
            ),
        }));

        let strengthWorkout = strengthExercises.map((exercise) => ({
            ...exercise,
            suggestedSets: Math.min(4, calculateRemainingSets(exercise)),
        }));

        const nSunsWorkout = nSunsExercises.slice(0, 1).map((exercise) => ({
            ...exercise,
            suggestedSets: Math.min(4, calculateRemainingSets(exercise)),
        }));

        if (nSunsWorkout.some((exercise) => exercise.muscleGroup === "Legs")) {
            strengthWorkout = strengthWorkout.filter((exercise) => exercise.muscleGroup === "Legs");
        } else {
            strengthWorkout = strengthWorkout.filter((exercise) => exercise.muscleGroup !== "Legs");
        }

        // combine nsuns and strength workouts
        const combinedStrengthWorkout = [...nSunsWorkout, ...strengthWorkout].slice(0, 5);

        const mobilityWorkout = mobilityExercises.slice(0, 4).map((exercise) => ({
            ...exercise,
            suggestedSets: Math.min(3, calculateRemainingSets(exercise)),
        }));

        const workoutSections = [
            { title: "Endurance", data: enduranceWorkout },
            { title: "Strength", data: combinedStrengthWorkout },
            { title: "Mobility", data: mobilityWorkout },
        ].filter((section) => section.data.length > 0);

        setSuggestedWorkout(workoutSections);
    };

    const renderExerciseItem = ({ item }: { item: Exercise & { suggestedSets?: number } }) => (
        <TouchableOpacity
            style={styles.exerciseItem}
            onPress={() =>
                navigation.navigate("ExerciseHistory", { exerciseId: item.id } as {
                    exerciseId: string;
                })
            }
        >
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseDetails}>
                {item.category === "endurance"
                    ? `${item.suggestedSets} km`
                    : `${item.suggestedSets} sets`}
            </Text>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Suggested Workout</Text>
            {suggestedWorkout.length > 0 ? (
                <SectionList
                    sections={suggestedWorkout}
                    renderItem={renderExerciseItem}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={(item) => item.id}
                />
            ) : (
                <Text style={styles.noWorkoutText}>No workout suggested at this time.</Text>
            )}
            <TouchableOpacity style={styles.regenerateButton} onPress={generateWorkout}>
                <Text style={styles.regenerateButtonText}>Regenerate Workout</Text>
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: typeof lightTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 16,
            backgroundColor: theme.colors.background,
        },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 16,
            color: theme.colors.text,
        },
        sectionHeader: {
            fontSize: 20,
            fontWeight: "bold",
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            padding: 8,
        },
        exerciseItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        exerciseName: {
            fontSize: 18,
            color: theme.colors.text,
        },
        exerciseDetails: {
            fontSize: 16,
        },
        noWorkoutText: {
            fontSize: 18,
            textAlign: "center",
            marginTop: 20,
        },
        regenerateButton: {
            backgroundColor: theme.colors.primary,
            padding: 16,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 20,
        },
        regenerateButtonText: {
            fontSize: 18,
            fontWeight: "bold",
        },
    });

export default SuggestedWorkoutScreen;
