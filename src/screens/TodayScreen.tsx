// src/screens/TodayScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../styles/globalStyles";
import { Exercise, ExerciseHistoryEntry } from "../contexts/Exercise";
import { subDays, isAfter } from "date-fns";

type WorkoutType = {
    id: string;
    name: string;
    category: string; // 'strength', 'endurance', 'mobility'
    muscleGroups: string[];
    icon: string;
    recommended: number; // higher number = more recommended
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
                    return total + (entry as any).sets;
                } else if (entry.category === "mobility") {
                    return total + (entry as any).sets;
                } else if (entry.category === "endurance") {
                    return total + (entry as any).distance;
                }
            }
            return total;
        }, 0);

        let remainingSets = exercise.weeklySets - setsDoneInInterval;

        if (exercise.category === "endurance") {
            remainingSets = exercise.weeklySets * (exercise.distance ?? 0) - setsDoneInInterval;
        }

        return Math.max(0, remainingSets);
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

        // Define workout templates
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
                icon: "body",
                recommended: 0,
            },
            {
                id: "full_body",
                name: "Full Body Strength",
                category: "strength",
                muscleGroups: ["Arms", "Back", "Chest", "Shoulders", "Legs", "Lower Legs", "Core"],
                icon: "fitness",
                recommended: 0,
            },
            {
                id: "run",
                name: "Running",
                category: "endurance",
                muscleGroups: ["Legs"],
                icon: "walk",
                recommended: 0,
            },
            {
                id: "mobility",
                name: "Mobility & Stretching",
                category: "mobility",
                muscleGroups: ["Shoulders", "Hips", "Legs"],
                icon: "body-outline",
                recommended: 0,
            },
            {
                id: "core",
                name: "Core Workout",
                category: "strength",
                muscleGroups: ["Core"],
                icon: "fitness-outline",
                recommended: 0,
            },
        ];

        // Calculate recommendation scores for each workout
        const updatedWorkouts = workoutTemplates.map((workout) => {
            let score = 0;

            workout.muscleGroups.forEach((muscleGroup) => {
                if (muscleGroupScores[workout.category][muscleGroup]) {
                    score += muscleGroupScores[workout.category][muscleGroup];
                }
            });

            // Adjust score based on number of muscle groups
            score = score * (1 + workout.muscleGroups.length / 10);

            return {
                ...workout,
                recommended: score,
            };
        });

        // Sort workouts by recommendation score
        const sortedWorkouts = updatedWorkouts.sort((a, b) => b.recommended - a.recommended);
        setSuggestedWorkouts(sortedWorkouts);
    };

    const handleWorkoutSelect = (workout: WorkoutType) => {
        // Navigate to WorkoutDetailScreen with filter
        navigation.navigate("WorkoutDetail", {
            category: workout.category,
            muscleGroups: workout.muscleGroups,
            workoutName: workout.name,
        });
    };

    const getRecommendationText = (recommended: number) => {
        if (recommended === 0) return "All done!";
        if (recommended < 5) return "Low priority";
        if (recommended < 15) return "Recommended";
        return "Highly recommended";
    };

    const getRecommendationColor = (recommended: number) => {
        if (recommended === 0) return "#888888";
        if (recommended < 5) return "#FFA500";
        if (recommended < 15) return "#32CD32";
        return "#FF4500";
    };

    const renderWorkoutItem = ({ item }: { item: WorkoutType }) => (
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
                <Icon name={item.icon} size={32} color={currentTheme.colors.primary} />
                <Text style={[styles.workoutName, { color: currentTheme.colors.text }]}>
                    {item.name}
                </Text>
            </View>
            <View style={styles.workoutDetails}>
                <Text style={[styles.workoutCategory, { color: currentTheme.colors.text }]}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
                <Text
                    style={[
                        styles.recommendationTag,
                        { backgroundColor: getRecommendationColor(item.recommended) },
                    ]}
                >
                    {getRecommendationText(item.recommended)}
                </Text>
            </View>
            <Text style={[styles.muscleGroups, { color: currentTheme.colors.text }]}>
                {item.muscleGroups.join(", ")}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <Text style={[styles.headerText, { color: currentTheme.colors.text }]}>
                Today's Workout Suggestions
            </Text>
            <Text style={[styles.subText, { color: currentTheme.colors.text }]}>
                Based on your remaining training sets
            </Text>

            <FlatList
                data={suggestedWorkouts}
                renderItem={renderWorkoutItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    headerText: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        marginBottom: 24,
        opacity: 0.8,
    },
    listContainer: {
        paddingBottom: 20,
    },
    workoutCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    workoutHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    workoutName: {
        fontSize: 20,
        fontWeight: "bold",
        marginLeft: 12,
    },
    workoutDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    workoutCategory: {
        fontSize: 16,
    },
    recommendationTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        fontSize: 14,
        color: "white",
        fontWeight: "bold",
    },
    muscleGroups: {
        fontSize: 14,
        opacity: 0.7,
    },
});

export default TodayScreen;
