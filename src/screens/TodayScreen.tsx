import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../styles/globalStyles";
import {
    EnduranceExerciseHistoryEntry,
    Exercise,
    ExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../contexts/Exercise";
import { subDays, isAfter } from "date-fns";

type WorkoutType = {
    id: string;
    name: string;
    category: string;
    muscleGroups: string[];
    icon: string;
    recommended: number;
};

const TodayScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const { exercises, exerciseHistory, trainingInterval } = useExerciseContext();
    const [suggestedWorkouts, setSuggestedWorkouts] = useState<WorkoutType[]>([]);

    useEffect(() => {
        generateWorkoutSuggestions();
    }, [exercises, exerciseHistory, trainingInterval]);

    const calculateRemainingSets = (exercise: Exercise) => {
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
                    return total + (entry as EnduranceExerciseHistoryEntry).sets;
                }
            }
            return total;
        }, 0);

        return exercise.weeklySets - setsDoneInInterval;
    };

    const calculateMuscleGroupScores = () => {
        const muscleGroupScores: { [key: string]: { [key: string]: number } } = {
            strength: {},
            mobility: {},
            endurance: {},
        };

        exercises.forEach((exercise) => {
            const remainingSets = calculateRemainingSets(exercise);
            if (remainingSets <= 0) return;

            const category = exercise.category;
            const muscleGroup = exercise.muscleGroup;

            if (!muscleGroupScores[category][muscleGroup]) {
                muscleGroupScores[category][muscleGroup] = 0;
            }
            muscleGroupScores[category][muscleGroup] += remainingSets;
        });

        return muscleGroupScores;
    };

    const generateWorkoutSuggestions = () => {
        const muscleGroupScores = calculateMuscleGroupScores();
        const workoutTemplates: WorkoutType[] = [
            {
                id: "upper_body",
                name: "Upper Body",
                category: "strength",
                muscleGroups: ["Arms", "Back", "Chest", "Shoulders"],
                icon: "barbell",
                recommended: 0,
            },
            {
                id: "lower_body",
                name: "Lower Body",
                category: "strength",
                muscleGroups: ["Legs", "Lower Legs"],
                icon: "barbell",
                recommended: 0,
            },
            {
                id: "full_body",
                name: "Full Body Strength",
                category: "strength",
                muscleGroups: ["Arms", "Back", "Chest", "Shoulders", "Legs", "Lower Legs", "Core"],
                icon: "barbell",
                recommended: 0,
            },
            {
                id: "run",
                name: "Endurance",
                category: "endurance",
                muscleGroups: ["Legs"],
                icon: "walk",
                recommended: 0,
            },
            {
                id: "mobility",
                name: "Mobility",
                category: "mobility",
                muscleGroups: ["Shoulders", "Hips", "Legs"],
                icon: "body-outline",
                recommended: 0,
            },
        ];

        const updatedWorkouts = workoutTemplates.map((workout) => {
            let score = 0;
            workout.muscleGroups.forEach((muscleGroup) => {
                if (muscleGroupScores[workout.category][muscleGroup]) {
                    score += muscleGroupScores[workout.category][muscleGroup];
                }
            });
            return { ...workout, recommended: score };
        });

        setSuggestedWorkouts(updatedWorkouts.sort((a, b) => b.recommended - a.recommended));
    };

    const handleWorkoutSelect = (workout: WorkoutType) => {
        navigation.navigate("WorkoutDetail", {
            category: workout.category,
            muscleGroups: workout.muscleGroups,
            workoutName: workout.name,
        });
    };

    const getRecommendationText = (recommended: number) => {
        const score = Math.round(recommended);
        if (score === 0) return "completed";
        if (score < 5) return "low priority";
        if (score < 15) return "recommended";
        return "highly recommended";
    };

    const getRecommendationColor = (recommended: number) => {
        if (recommended === 0) return "#4CAF50";
        if (recommended < 5) return "#FFB300";
        if (recommended < 15) return "#2196F3";
        return "#F44336";
    };

    const renderWorkoutItem = ({ item }: { item: WorkoutType }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.workoutCard,
                    {
                        backgroundColor: currentTheme.colors.card,
                        borderColor: currentTheme.colors.border,
                    },
                ]}
                onPress={() => handleWorkoutSelect(item)}
            >
                <View style={styles.workoutHeader}>
                    <Icon name={item.icon} size={28} color={currentTheme.colors.primary} />
                    <Text style={[styles.workoutName, { color: currentTheme.colors.text }]}>
                        {item.name}
                    </Text>
                </View>
                <Text style={[styles.muscleGroups, { color: currentTheme.colors.text }]}>
                    {item.muscleGroups.join(" • ")}
                </Text>
                <View style={styles.recommendationContainer}>
                    <Text
                        style={[
                            styles.recommendationText,
                            { color: getRecommendationColor(item.recommended) },
                        ]}
                    >
                        {getRecommendationText(item.recommended)}
                    </Text>
                    <Text
                        style={[
                            styles.recommendationText,
                            { color: getRecommendationColor(item.recommended) },
                        ]}
                    >
                        {Math.round(item.recommended)} remaining sets
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <FlatList
                data={suggestedWorkouts}
                renderItem={renderWorkoutItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    headerText: {
        fontSize: 32,
        fontWeight: "800",
        letterSpacing: -0.5,
        marginBottom: 24,
    },
    subText: {
        fontSize: 16,
        marginTop: 6,
        marginBottom: 24,
        opacity: 0.6,
    },
    listContainer: {
        paddingBottom: 40,
    },
    workoutCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    workoutHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    workoutName: {
        fontSize: 24,
        fontWeight: "700",
        marginLeft: 12,
        flex: 1,
    },
    muscleGroups: {
        fontSize: 16,
        opacity: 0.6,
        marginBottom: 8,
    },
    recommendationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    recommendationText: {
        fontSize: 16,
        fontWeight: "600",
    },
});

export default TodayScreen;
