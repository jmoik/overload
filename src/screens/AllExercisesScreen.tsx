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
import { generateEntryId } from "../utils/utils";

type CategoryFilter = "all" | "strength" | "mobility" | "endurance";

const AllExercisesScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createAllExercisesStyles(currentTheme);
    const { exercises, addExerciseToHistory, deleteExercise, exerciseHistory, trainingInterval } =
        useExerciseContext();
    const navigation = useNavigation<RoutineScreenNavigationProp>();
    const swipeableRefs = useRef(new Map<string, Swipeable | null>());
    const isFocused = useIsFocused();
    const [sortBySetsLeft, setSortBySetsLeft] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
    const [hideCompleted, setHideCompleted] = useState(false);

    useEffect(() => {
        if (isFocused) {
            swipeableRefs.current.forEach((ref) => ref?.close());
        }
    }, [isFocused]);

    const getFilterIcon = (filter: CategoryFilter) => {
        switch (filter) {
            case "all":
                return "funnel-outline";
            case "strength":
                return "barbell";
            case "mobility":
                return "body";
            case "endurance":
                return "bicycle";
            default:
                return "fitness";
        }
    };

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
    }, []);

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
                        distance: 1,
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
    }, [handleLogSet]);

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
                                // requestAnimationFrame(() => {
                                //     ref?.close();
                                // });
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
        ]
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        onPress={() =>
                            setCategoryFilter((prev) => {
                                switch (prev) {
                                    case "all":
                                        return "strength";
                                    case "strength":
                                        return "mobility";
                                    case "mobility":
                                        return "endurance";
                                    case "endurance":
                                        return "all";
                                    default:
                                        return "all";
                                }
                            })
                        }
                        style={styles.headerButton}
                    >
                        <Icon
                            name={getFilterIcon(categoryFilter)}
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
    }, [navigation, sortBySetsLeft, categoryFilter, hideCompleted, currentTheme.colors.primary]);

    const calculateTotalSetsForGroup = useCallback((exercises: Exercise[]) => {
        return exercises.reduce((total, exercise) => {
            if (exercise.category === "endurance") {
                return total + exercise.weeklySets * (exercise.distance ?? 0);
            }
            return total + exercise.weeklySets;
        }, 0);
    }, []);

    const groupedAndSortedExercises = React.useMemo(() => {
        let filteredExercises = exercises;

        if (categoryFilter !== "all") {
            filteredExercises = exercises.filter(
                (exercise) => exercise.category === categoryFilter
            );
        }

        if (hideCompleted) {
            filteredExercises = filteredExercises.filter(
                (exercise) => calculateRemainingSets(exercise) > 0
            );
        }

        const grouped = filteredExercises.reduce((acc, exercise) => {
            const key = exercise.muscleGroup;
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
        categoryFilter,
        sortBySetsLeft,
        calculateRemainingSets,
        hideCompleted,
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
            <SectionList
                sections={groupedAndSortedExercises}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={renderExerciseItem}
                renderSectionHeader={renderSectionHeader}
            />
        </View>
    );
};

export default AllExercisesScreen;
