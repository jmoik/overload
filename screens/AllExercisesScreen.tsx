// screens/RoutineScreen.tsx
import React, { useLayoutEffect, useCallback, useRef, useEffect, useState } from "react";
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
    const [sortBySetsLeft, setSortBySetsLeft] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        onPress={() => setSortBySetsLeft(!sortBySetsLeft)}
                        style={styles.headerButton}
                    >
                        <Icon
                            name={sortBySetsLeft ? "time-outline" : "list-outline"}
                            size={24}
                            color={currentTheme.colors.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("AddExercise")}
                        style={styles.headerButton}
                    >
                        <Icon name="add-circle" size={24} color={currentTheme.colors.primary} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, sortBySetsLeft, currentTheme.colors.primary]);

    useEffect(() => {
        if (isFocused) {
            // Close all open Swipeable components when the screen comes into focus
            swipeableRefs.current.forEach((ref) => ref?.close());
        }
    }, [isFocused]);

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
                    return total + entry.sets * entry.rpe;
                }
                return total;
            }, 0);

            const remainingSets = exercise.weeklySets * exercise.targetRPE - setsDoneInInterval;
            return remainingSets;
        },
        [exerciseHistory, trainingInterval]
    );

    const groupedAndSortedExercises = React.useMemo(() => {
        const grouped = exercises.reduce((acc, exercise) => {
            const category = exercise.category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(exercise);
            return acc;
        }, {} as Record<string, Exercise[]>);

        Object.keys(grouped).forEach((category) => {
            grouped[category].sort((a, b) => {
                if (sortBySetsLeft) {
                    return calculateRemainingSets(a) - calculateRemainingSets(b);
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
        });

        const sortedCategories = Object.keys(grouped).sort();

        return sortedCategories.map((category) => ({
            title: category,
            data: grouped[category],
        }));
    }, [exercises, sortBySetsLeft, calculateRemainingSets]);

    const renderExerciseItem = useCallback(
        ({
            item,
            index,
            section,
        }: {
            item: Exercise;
            index: number;
            section: { title: string };
        }) => {
            const remainingTrainingLoad = calculateRemainingSets(item);
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
                        <View style={styles.exerciseItemLeft}>
                            <Text style={styles.exerciseName}>{item.name}</Text>
                            <Text style={styles.exerciseDescription}>{item.description}</Text>
                            <Text style={styles.exerciseSetsPerWeek}>
                                {item.weeklySets * item.targetRPE} training load per week
                            </Text>
                        </View>
                        <View style={styles.exerciseItemRight}>
                            <Text style={styles.remainingSets}>Load: {remainingTrainingLoad}</Text>
                        </View>
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
                sections={groupedAndSortedExercises}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={renderExerciseItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
            />
        </View>
    );
};

export default AllExercisesScreen;
