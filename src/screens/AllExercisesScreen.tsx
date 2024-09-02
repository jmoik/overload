// screens/RoutineScreen.tsx
import React, { useLayoutEffect, useCallback, useRef, useEffect, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { Swipeable } from "react-native-gesture-handler";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { RoutineScreenNavigationProp } from "../types/navigation";
import {
    EnduranceExerciseHistoryEntry,
    Exercise,
    ExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../contexts/Exercise";
import { subDays, isAfter } from "date-fns";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createAllExercisesStyles } from "../../styles/globalStyles";

const AllExercisesScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createAllExercisesStyles(currentTheme);
    const { exercises, deleteExercise, exerciseHistory, trainingInterval } = useExerciseContext();
    const navigation = useNavigation<RoutineScreenNavigationProp>();
    const swipeableRefs = useRef<(Swipeable | null)[]>([]);
    const isFocused = useIsFocused();
    const [sortBySetsLeft, setSortBySetsLeft] = useState(true);
    const [groupBy, setGroupBy] = useState<"category" | "muscleGroup" | "none">("category");
    const [hideCompleted, setHideCompleted] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        onPress={() =>
                            setGroupBy((prev) => {
                                if (prev === "category") return "muscleGroup";
                                if (prev === "muscleGroup") return "none";
                                return "category";
                            })
                        }
                        style={styles.headerButton}
                    >
                        <Icon
                            name={
                                groupBy === "category"
                                    ? "pricetag"
                                    : groupBy === "muscleGroup"
                                    ? "body"
                                    : "layers"
                            }
                            size={styles.icon.fontSize}
                            color={currentTheme.colors.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setHideCompleted(!hideCompleted)}
                        style={styles.headerButton}
                    >
                        <Icon
                            name={hideCompleted ? "eye-off" : "eye"}
                            size={styles.icon.fontSize}
                            color={currentTheme.colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            ),
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        onPress={() => setSortBySetsLeft(!sortBySetsLeft)}
                        style={styles.headerButton}
                    >
                        <Icon
                            name={sortBySetsLeft ? "arrow-up" : "list"}
                            size={styles.icon.fontSize}
                            color={currentTheme.colors.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("AddExercise")}
                        style={styles.headerButton}
                    >
                        <Icon
                            name="add-circle"
                            size={styles.icon.fontSize}
                            color={currentTheme.colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, sortBySetsLeft, groupBy, hideCompleted, currentTheme.colors.primary]);

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
            const setsDoneInInterval = history.reduce((total, entry: ExerciseHistoryEntry) => {
                if (isAfter(new Date(entry.date), intervalStart)) {
                    // cast to StrengthExerciseHistoryEntry to access the sets property
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

            // for endurance set use distance
            if (exercise.category === "endurance") {
                remainingSets = exercise.weeklySets * (exercise.distance ?? 0) - setsDoneInInterval;
            }
            return remainingSets;
        },
        [exerciseHistory, trainingInterval]
    );

    const groupedAndSortedExercises = React.useMemo(() => {
        let filteredExercises = exercises;
        if (hideCompleted) {
            filteredExercises = exercises.filter(
                (exercise) => calculateRemainingSets(exercise) > 0
            );
        }

        if (groupBy === "none") {
            const sortedExercises = [...filteredExercises].sort((a, b) => {
                if (sortBySetsLeft) {
                    return calculateRemainingSets(b) - calculateRemainingSets(a);
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
            return [{ title: "", data: sortedExercises, key: "none" }];
        }

        const grouped = filteredExercises.reduce((acc, exercise) => {
            const key = groupBy === "category" ? exercise.category : exercise.muscleGroup;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(exercise);
            return acc;
        }, {} as Record<string, Exercise[]>);

        Object.keys(grouped).forEach((key) => {
            grouped[key].sort((a, b) => {
                if (sortBySetsLeft) {
                    return calculateRemainingSets(b) - calculateRemainingSets(a);
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
        });

        const sortedKeys = Object.keys(grouped).sort();

        return sortedKeys.map((key) => ({
            title: key,
            data: grouped[key],
            key: `${groupBy}-${key}`,
        }));
    }, [exercises, groupBy, sortBySetsLeft, calculateRemainingSets, hideCompleted]);

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
            const setsLeft = remainingTrainingLoad;
            const setsLeftColor = setsLeft <= 0 ? "green" : "red";

            const weeklySetsText =
                item.category === "endurance"
                    ? `${item.weeklySets * item.distance!} km / interval`
                    : `${item.weeklySets} sets / interval`;

            const setsLeftText =
                item.category === "endurance"
                    ? `${setsLeft.toFixed(1)} km left`
                    : `Sets left: ${setsLeft}`;

            return (
                <Swipeable
                    key={item.id} // Use the exercise's id as the key
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
                            <Text style={styles.exerciseSetsPerWeek}>{weeklySetsText}</Text>
                        </View>
                        <View style={styles.exerciseItemRight}>
                            <Text style={[styles.remainingSets, { color: setsLeftColor }]}>
                                {setsLeftText}
                            </Text>
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

    return (
        <View style={styles.container}>
            <SectionList
                sections={groupedAndSortedExercises}
                keyExtractor={(item, index) => `${item.id}-${index}`} // Use both id and index for extra uniqueness
                renderItem={renderExerciseItem}
                renderSectionHeader={({ section: { title } }) =>
                    groupBy !== "none" ? (
                        <Text style={styles.sectionHeader}>
                            {title.charAt(0).toUpperCase() + title.slice(1)}
                        </Text>
                    ) : null
                }
            />
        </View>
    );
};

export default AllExercisesScreen;
