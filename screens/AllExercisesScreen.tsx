// screens/RoutineScreen.tsx
import React, { useLayoutEffect, useCallback, useRef, useEffect } from "react";
import { View, Text, SectionList, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { Swipeable } from "react-native-gesture-handler";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { RoutineScreenNavigationProp } from "../types/navigation";
import { Exercise } from "../models/Exercise";
import { subDays, isAfter } from "date-fns";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createAllExercisesStyles } from "../styles/globalStyles";

const AllExercisesScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createAllExercisesStyles(currentTheme);
    const { exercises, deleteExercise, exerciseHistory, trainingInterval } = useExerciseContext();
    const navigation = useNavigation<RoutineScreenNavigationProp>();
    const swipeableRefs = useRef<(Swipeable | null)[]>([]);
    const isFocused = useIsFocused();
    useEffect(() => {
        if (isFocused) {
            // Close all open Swipeable components when the screen comes into focus
            swipeableRefs.current.forEach((ref) => ref?.close());
        }
    }, [isFocused]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("AddExercise")}
                    style={styles.addButton}
                >
                    <Icon name="add-circle" size={24} color="#007AFF" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleExercisePress = (exerciseId: string) => {
        navigation.navigate("ExerciseHistory", { exerciseId });
    };

    const handleDeleteExercise = useCallback(
        (exerciseId: string, exerciseName: string) => {
            Alert.alert("Delete Exercise", `Are you sure you want to delete ${exerciseName}?`, [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => {
                        deleteExercise(exerciseId);
                        swipeableRefs.current.forEach((ref) => ref?.close());
                    },
                    style: "destructive",
                },
            ]);
        },
        [deleteExercise]
    );

    const renderRightActions = useCallback(
        (exerciseId: string, exerciseName: string) => {
            return (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteExercise(exerciseId, exerciseName)}
                >
                    <Icon name="trash-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            );
        },
        [handleDeleteExercise]
    );

    const handleEditExercise = useCallback(
        (exerciseId: string, index: number) => {
            navigation.navigate("AddExercise", { exerciseId });
            // Close the Swipeable component after navigating
            swipeableRefs.current[index]?.close();
        },
        [navigation]
    );

    const renderLeftActions = useCallback(() => {
        return (
            <View style={styles.editButton}>
                <Icon name="create-outline" size={24} color="#FFFFFF" />
            </View>
        );
    }, []);

    const calculateRemainingSets = useCallback(
        (exercise: Exercise) => {
            const today = new Date();
            const intervalStart = subDays(today, trainingInterval);

            const history = exerciseHistory[exercise.id] || [];
            const setsDoneInInterval = history.reduce((total, entry) => {
                if (isAfter(new Date(entry.date), intervalStart)) {
                    return total + entry.sets;
                }
                return total;
            }, 0);

            const remainingSets = Math.max(0, exercise.setsPerWeek - setsDoneInInterval);
            return remainingSets;
        },
        [exerciseHistory, trainingInterval]
    );

    const renderExerciseItem = useCallback(
        ({ item, index }: { item: Exercise; index: number }) => {
            const remainingSets = calculateRemainingSets(item);
            return (
                <Swipeable
                    ref={(el) => (swipeableRefs.current[index] = el)}
                    renderRightActions={() => renderRightActions(item.id, item.name)}
                    renderLeftActions={renderLeftActions}
                    onSwipeableLeftOpen={() => handleEditExercise(item.id, index)}
                    rightThreshold={40}
                    leftThreshold={40}
                >
                    <TouchableOpacity
                        style={styles.exerciseItem}
                        onPress={() => handleExercisePress(item.id)}
                    >
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        <Text>{item.description}</Text>
                        <Text>{item.setsPerWeek} sets per week</Text>
                        <Text style={styles.remainingSets}>
                            Remaining sets in interval: {remainingSets}
                        </Text>
                    </TouchableOpacity>
                </Swipeable>
            );
        },
        [
            handleExercisePress,
            renderRightActions,
            renderLeftActions,
            handleEditExercise,
            calculateRemainingSets,
        ]
    );

    // Group exercises by category
    const groupedExercises = exercises.reduce((acc, exercise) => {
        const category = exercise.category || "Uncategorized";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(exercise);
        return acc;
    }, {} as Record<string, Exercise[]>);

    const sections = Object.entries(groupedExercises).map(([category, data]) => ({
        title: category,
        data,
    }));

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderExerciseItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
            />
        </View>
    );
};

export default AllExercisesScreen;
