import React, { useLayoutEffect, useCallback, useRef, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { Swipeable } from "react-native-gesture-handler";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { RootStackParamList } from "../types/navigation";
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
import { generateEntryId } from "../utils/utils";
import { StackNavigationProp } from "@react-navigation/stack";

type WorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, "WorkoutDetail">;
type WorkoutDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, "WorkoutDetail">;

const WorkoutDetailScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createAllExercisesStyles(currentTheme);
    const { exercises, addExerciseToHistory, exerciseHistory, trainingInterval } =
        useExerciseContext();
    const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
    const route = useRoute<WorkoutDetailScreenRouteProp>();
    const swipeableRefs = useRef(new Map<string, Swipeable | null>());
    const [sortBySetsLeft, setSortBySetsLeft] = useState(true);
    const [hideCompleted, setHideCompleted] = useState(true);

    // Extract workout details from route params
    const { workoutName, category, muscleGroups } = route.params;

    // Set navigation title and header buttons
    useLayoutEffect(() => {
        navigation.setOptions({
            title: workoutName,
            headerRight: () => (
                <View style={{ flexDirection: "row", marginRight: 15 }}>
                    <TouchableOpacity
                        onPress={() => setSortBySetsLeft(!sortBySetsLeft)}
                        style={{ marginRight: 15 }}
                    >
                        <Icon
                            name={sortBySetsLeft ? "arrow-up" : "list"}
                            size={24}
                            color={currentTheme.colors.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setHideCompleted(!hideCompleted)}>
                        <Icon
                            name={hideCompleted ? "eye-off" : "eye"}
                            size={24}
                            color={currentTheme.colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, workoutName, sortBySetsLeft, hideCompleted, currentTheme.colors.primary]);

    const handleExercisePress = (exerciseId: string) => {
        navigation.navigate("ExerciseHistory", { exerciseId });
    };

    const handleEditExercise = useCallback(
        (exerciseId: string) => {
            navigation.navigate("AddExercise", { exerciseId });
            const ref = swipeableRefs.current.get(exerciseId);
            if (ref) {
                ref.close();
            }
        },
        [navigation]
    );

    const renderRightActions = useCallback(() => {
        return (
            <View style={styles.editButton}>
                <Icon name="create-outline" size={24} color="#FFFFFF" />
            </View>
        );
    }, [styles.editButton]);

    const handleLogSet = useCallback(
        (exercise: Exercise) => {
            let entryWithoutId;

            switch (exercise.category) {
                case "strength":
                    entryWithoutId = {
                        date: new Date(),
                        category: "strength" as const,
                        sets: 1,
                        reps: 0,
                        weight: 0,
                        notes: "auto logged",
                    };
                    break;
                case "mobility":
                    entryWithoutId = {
                        date: new Date(),
                        category: "mobility" as const,
                        sets: 1,
                        notes: "auto logged",
                    };
                    break;
                case "endurance":
                    entryWithoutId = {
                        date: new Date(),
                        category: "endurance" as const,
                        sets: 1,
                        time: 0,
                        notes: "auto logged",
                    };
                    break;
                default:
                    entryWithoutId = {
                        date: new Date(),
                        category: "strength" as const,
                        sets: 1,
                        reps: 0,
                        weight: 0,
                        notes: "",
                    };
            }

            const entry = {
                ...entryWithoutId,
                id: generateEntryId(entryWithoutId),
            };

            addExerciseToHistory(exercise.id, entry);
        },
        [addExerciseToHistory]
    );

    const renderLeftActions = useCallback(() => {
        return (
            <TouchableOpacity style={[styles.editButton, { backgroundColor: "#4CAF50" }]}>
                <Icon name="checkmark-circle-outline" size={24} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF" }}>Log Set</Text>
            </TouchableOpacity>
        );
    }, [styles.editButton]);

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
                        return total + (entry as EnduranceExerciseHistoryEntry).sets;
                    }
                }
                return total;
            }, 0);

            const remainingSets = exercise.weeklySets - setsDoneInInterval;
            return remainingSets;
        },
        [exerciseHistory, trainingInterval]
    );

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
                    ? `${item.weeklySets} km / interval`
                    : `${item.weeklySets} sets / interval`;

            const setsLeftText =
                item.category === "endurance"
                    ? `${setsLeft.toFixed(1)} km left`
                    : `Sets left: ${setsLeft}`;

            return (
                <Swipeable
                    key={item.id}
                    ref={(el) => swipeableRefs.current.set(item.id, el)}
                    renderRightActions={() => renderRightActions()}
                    renderLeftActions={() => renderLeftActions()}
                    onSwipeableLeftWillOpen={() => {
                        try {
                            handleLogSet(item);
                            const ref = swipeableRefs.current.get(item.id);
                            if (ref) {
                                ref.close();
                            }
                        } catch (error) {
                            console.error("Error closing swipeable:", error);
                        }
                    }}
                    onSwipeableRightOpen={() => handleEditExercise(item.id)}
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
            styles.exerciseItem,
            styles.exerciseItemLeft,
            styles.exerciseName,
            styles.exerciseDescription,
            styles.exerciseSetsPerWeek,
            styles.exerciseItemRight,
            styles.remainingSets,
        ]
    );

    const calculateTotalSetsForGroup = useCallback((exercises: Exercise[]) => {
        return exercises.reduce((total, exercise) => {
            return total + exercise.weeklySets;
        }, 0);
    }, []);

    const groupedAndSortedExercises = React.useMemo(() => {
        // Filter exercises first by category and muscle groups
        let filteredExercises = exercises.filter((exercise) => {
            // Skip exercises with 0 weekly sets
            if (exercise.weeklySets <= 0) return false;

            // Filter by category
            if (exercise.category !== category) return false;

            // Filter by muscle groups if specified
            if (muscleGroups && muscleGroups.length > 0) {
                return muscleGroups.includes(exercise.muscleGroup);
            }

            return true;
        });

        // Apply completed filter only when hideCompleted is true
        if (hideCompleted) {
            filteredExercises = filteredExercises.filter(
                (exercise) => calculateRemainingSets(exercise) > 0
            );
        }

        // Group the filtered exercises by muscle group
        const grouped = filteredExercises.reduce((acc, exercise) => {
            const key = exercise.muscleGroup;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(exercise);
            return acc;
        }, {} as Record<string, Exercise[]>);

        // Sort exercises within each group
        Object.keys(grouped).forEach((key) => {
            grouped[key].sort((a, b) => {
                if (sortBySetsLeft) {
                    return calculateRemainingSets(b) - calculateRemainingSets(a);
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
        });

        // Create sections with total sets calculation
        const sections = Object.keys(grouped)
            .sort()
            .map((muscleGroup) => {
                const totalSets = calculateTotalSetsForGroup(grouped[muscleGroup]);
                const formattedTotal = grouped[muscleGroup].some(
                    (ex) => ex.category === "endurance"
                )
                    ? `${totalSets.toFixed(1)} km`
                    : `${totalSets} sets`;

                return {
                    title: muscleGroup,
                    data: grouped[muscleGroup],
                    key: muscleGroup,
                    totalSets: formattedTotal,
                };
            });

        return sections;
    }, [
        exercises,
        category,
        muscleGroups,
        sortBySetsLeft,
        hideCompleted,
        calculateRemainingSets,
        calculateTotalSetsForGroup,
    ]);

    const renderSectionHeader = useCallback(
        ({ section: { title, totalSets } }) => (
            <Text style={styles.sectionHeader}>
                {title.charAt(0).toUpperCase() + title.slice(1)} ({totalSets})
            </Text>
        ),
        [styles.sectionHeader]
    );

    return (
        <View style={styles.container}>
            {groupedAndSortedExercises.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="checkmark-circle" size={64} color={currentTheme.colors.primary} />
                    <Text style={[styles.emptyText, { color: currentTheme.colors.text }]}>
                        All exercises in this workout are completed!
                    </Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text
                            style={[styles.buttonText, { color: currentTheme.colors.background }]}
                        >
                            Return to Today
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <SectionList
                    sections={groupedAndSortedExercises}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={renderExerciseItem}
                    renderSectionHeader={renderSectionHeader}
                />
            )}
        </View>
    );
};

export default WorkoutDetailScreen;
