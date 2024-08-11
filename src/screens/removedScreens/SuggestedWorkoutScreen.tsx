import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import {
    EnduranceExerciseHistoryEntry,
    Exercise,
    ExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../styles/globalStyles";
import { isAfter, subDays } from "date-fns";
import { SwipeListView } from "react-native-swipe-list-view";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const SuggestedWorkoutScreen = () => {
    const { exercises, exerciseHistory, trainingInterval } = useExerciseContext();
    const [suggestedWorkout, setSuggestedWorkout] = useState<
        { title: string; data: (Exercise & { suggestedSets?: number })[] }[]
    >([]);
    const [unusedExercises, setUnusedExercises] = useState<{
        [key: string]: (Exercise & { suggestedSets?: number })[];
    }>({});
    const navigation = useNavigation();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = useMemo(() => createStyles(currentTheme), [currentTheme]);
    const swipeListRef = useRef(null);

    const calculateRemainingSets = useCallback(
        (exercise: Exercise) => {
            const today = new Date();
            const intervalStart = subDays(today, trainingInterval);

            const history = exerciseHistory[exercise.id] || [];
            const setsDoneInInterval = history.reduce((total, entry: ExerciseHistoryEntry) => {
                if (isAfter(new Date(entry.date), intervalStart)) {
                    if (entry.category === "strength" || entry.category === "nsuns") {
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

    const calculateSuggestedSets = useCallback(
        (exercise: Exercise) => {
            const remainingSets = calculateRemainingSets(exercise);
            if (exercise.category === "endurance") {
                return Math.min(
                    Math.max(4, Math.floor(((exercise.distance ?? 0) / trainingInterval) * 3)),
                    remainingSets
                );
            } else if (exercise.category === "strength" || exercise.category === "nsuns") {
                return Math.min(4, remainingSets);
            } else if (exercise.category === "mobility") {
                return Math.min(3, remainingSets);
            }
            return 0;
        },
        [calculateRemainingSets, trainingInterval]
    );

    const generateWorkout = useCallback(() => {
        const categorizeExercises = (category: string) =>
            exercises
                .filter(
                    (exercise) =>
                        exercise.category === category && calculateRemainingSets(exercise) > 0
                )
                .sort((a, b) => calculateRemainingSets(b) - calculateRemainingSets(a))
                .map((exercise) => ({
                    ...exercise,
                    suggestedSets: calculateSuggestedSets(exercise),
                }));

        const enduranceExercises = categorizeExercises("endurance");
        const strengthExercises = categorizeExercises("strength");
        const nSunsExercises = categorizeExercises("nsuns");
        const mobilityExercises = categorizeExercises("mobility");

        const enduranceWorkout = enduranceExercises.slice(0, 1);
        const nSunsWorkout = nSunsExercises.slice(0, 1);
        const strengthWorkout = strengthExercises.slice(0, 4);
        const mobilityWorkout = mobilityExercises.slice(0, 4);

        const workoutSections = [
            { title: "Endurance", data: enduranceWorkout },
            { title: "nSuns", data: nSunsWorkout },
            { title: "Strength", data: strengthWorkout },
            { title: "Mobility", data: mobilityWorkout },
        ].filter((section) => section.data.length > 0);

        setSuggestedWorkout(workoutSections);

        setUnusedExercises({
            Endurance: enduranceExercises.slice(1),
            nSuns: nSunsExercises.slice(1),
            Strength: strengthExercises.slice(4),
            Mobility: mobilityExercises.slice(4),
        });
    }, [exercises, calculateRemainingSets, calculateSuggestedSets]);

    useEffect(() => {
        generateWorkout();
    }, [generateWorkout]);

    const removeExercise = useCallback(
        (exerciseId: string) => {
            setSuggestedWorkout((prevWorkout) => {
                const updatedWorkout = prevWorkout.map((section) => ({
                    ...section,
                    data: section.data.filter((exercise) => exercise.id !== exerciseId),
                }));

                const removedExercise = prevWorkout
                    .flatMap((section) => section.data)
                    .find((exercise) => exercise.id === exerciseId);

                if (removedExercise) {
                    const category =
                        removedExercise.category === "nsuns"
                            ? "nSuns"
                            : capitalize(removedExercise.category);

                    setUnusedExercises((prevUnused) => {
                        if (prevUnused[category] && prevUnused[category].length > 0) {
                            const [alternativeExercise, ...restUnused] = prevUnused[category];

                            if (alternativeExercise) {
                                const sectionIndex = updatedWorkout.findIndex(
                                    (section) => section.title === category
                                );
                                if (sectionIndex !== -1) {
                                    const newExercise = {
                                        ...alternativeExercise,
                                        suggestedSets: calculateSuggestedSets(alternativeExercise),
                                    };
                                    updatedWorkout[sectionIndex].data.push(newExercise);
                                }
                            }

                            return {
                                ...prevUnused,
                                [category]: restUnused,
                            };
                        } else {
                            console.warn(`No unused exercises available for category: ${category}`);
                            return prevUnused;
                        }
                    });
                } else {
                    console.warn(`Exercise with id ${exerciseId} not found in the workout.`);
                }

                return updatedWorkout;
            });
        },
        [calculateSuggestedSets]
    );

    const onSwipeValueChange = useCallback(
        (swipeData: { key: string; value: number }) => {
            const { key, value } = swipeData;
            if (value < -200) {
                removeExercise(key);
            }
        },
        [removeExercise]
    );

    const renderExerciseItem = useCallback(
        ({ item }: { item: Exercise & { suggestedSets?: number } }) => (
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
                        ? `${item.suggestedSets?.toFixed(1)} km`
                        : `${item.suggestedSets} sets`}
                </Text>
            </TouchableOpacity>
        ),
        [navigation, styles]
    );

    const renderHiddenItem = useCallback(
        () => (
            <View style={styles.rowBack}>
                <Text style={styles.backRightBtnText}>Remove</Text>
            </View>
        ),
        [styles]
    );

    const keyExtractor = useCallback((item: Exercise) => item.id, []);

    const renderSectionHeader = useCallback(
        ({ section: { title } }: { section: { title: string } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
        ),
        [styles]
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Suggested Workout</Text>
            {suggestedWorkout.length > 0 ? (
                <SwipeListView
                    useSectionList
                    sections={suggestedWorkout}
                    renderItem={renderExerciseItem}
                    renderHiddenItem={renderHiddenItem}
                    rightOpenValue={-75}
                    disableRightSwipe
                    onSwipeValueChange={onSwipeValueChange}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={keyExtractor}
                    ref={swipeListRef}
                    useAnimatedList={true}
                    useNativeDriver={true}
                    recalculateHiddenLayout={true}
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
            backgroundColor: theme.colors.background,
        },
        exerciseName: {
            fontSize: 18,
            color: theme.colors.text,
        },
        exerciseDetails: {
            fontSize: 16,
            color: theme.colors.text,
        },
        noWorkoutText: {
            fontSize: 18,
            textAlign: "center",
            marginTop: 20,
            color: theme.colors.text,
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
            color: theme.colors.background,
        },
        rowBack: {
            alignItems: "center",
            backgroundColor: "red",
            flex: 1,
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingRight: 15,
        },
        backRightBtnText: {
            color: "#FFF",
        },
    });

export default SuggestedWorkoutScreen;
