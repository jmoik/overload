import React, { useState, useCallback, useRef, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    TextInput,
    Alert,
    SectionList,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { Set, StrengthExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import {
    lightTheme,
    darkTheme,
    createNsunsExerciseHistoryStyles,
} from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";
import { Swipeable } from "react-native-gesture-handler";

interface NSunsHistoryScreenProps {
    exerciseId: string;
}

const NSunsHistoryScreen: React.FC<NSunsHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createNsunsExerciseHistoryStyles(currentTheme);
    const { exerciseHistory, deleteExerciseHistoryEntry } = useExerciseContext();

    const { exercises, updateExercise, addExerciseToHistory } = useExerciseContext();
    const [exercise, setExercise] = useState(exercises.find((e) => e.id === exerciseId));
    const [isEditing1RM, setIsEditing1RM] = useState(false);
    const [editedOneRepMax, setEditedOneRepMax] = useState(exercise?.oneRepMax?.toString() || "");
    const inputRef = useRef<TextInput>(null);
    const [amrapReps, setAmrapReps] = useState<{ [key: number]: string }>({});

    const workout: Set[] = exercise?.workout || [];

    const [completedSets, setCompletedSets] = useState<boolean[]>(() =>
        new Array(workout.length).fill(false)
    );

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    const handleEdit1RM = () => {
        setIsEditing1RM(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSave1RM = () => {
        const newOneRepMax = parseFloat(editedOneRepMax);
        if (!isNaN(newOneRepMax) && exercise) {
            const updatedExercise = { ...exercise, oneRepMax: newOneRepMax };
            updateExercise(exerciseId, updatedExercise);
            setExercise(updatedExercise);
        }
        setIsEditing1RM(false);
    };

    const createHistoryEntries = () => {
        const currentDate = new Date();
        workout.forEach((set, index) => {
            const weight = calculateSetWeight(set);
            const reps = set.isAMRAP ? Number(amrapReps[index]) || set.reps : set.reps;
            const entryWithoutId: Omit<StrengthExerciseHistoryEntry, "id"> = {
                date: currentDate,
                notes: `Set ${index + 1} of nSuns workout${set.isAMRAP ? " (AMRAP)" : ""}`,
                sets: 1,
                reps: reps,
                weight: weight,
                category: "strength",
            };
            const entry: StrengthExerciseHistoryEntry = {
                ...entryWithoutId,
                id: generateEntryId(entryWithoutId),
            };
            addExerciseToHistory(exerciseId, entry);
        });
        setAmrapReps({});
    };

    const toggleSet = (index: number) => {
        if (workout[index].isAMRAP) {
            Alert.prompt(
                "AMRAP Set",
                "Enter the number of reps completed:",
                [
                    {
                        text: "Cancel",
                        onPress: () => {},
                        style: "cancel",
                    },
                    {
                        text: "OK",
                        onPress: (reps?: string) => {
                            if (reps && !isNaN(Number(reps)) && Number(reps) > 0) {
                                setAmrapReps((prev) => ({ ...prev, [index]: reps }));
                                setCompletedSets((prev) => {
                                    const newCompletedSets = [...prev];
                                    newCompletedSets[index] = true;
                                    checkAllSetsCompleted(newCompletedSets);
                                    return newCompletedSets;
                                });
                            }
                        },
                    },
                ],
                "plain-text",
                amrapReps[index],
                "numeric"
            );
        } else {
            setCompletedSets((prev) => {
                const newCompletedSets = [...prev];
                newCompletedSets[index] = !newCompletedSets[index];
                checkAllSetsCompleted(newCompletedSets);
                return newCompletedSets;
            });
        }
    };

    const checkAllSetsCompleted = (completedSets: boolean[]) => {
        if (completedSets.every((set) => set)) {
            Alert.alert("All Sets Completed", "Would you like to increase your 1RM by 2 kg?", [
                {
                    text: "No",
                    onPress: () => {
                        setCompletedSets(new Array(workout.length).fill(false));
                        createHistoryEntries();
                    },
                },
                {
                    text: "Yes",
                    onPress: () => {
                        if (exercise) {
                            const newOneRepMax = Math.floor((exercise.oneRepMax ?? 0) + 2);
                            const updatedExercise = { ...exercise, oneRepMax: newOneRepMax };
                            updateExercise(exerciseId, updatedExercise);
                            setExercise(updatedExercise);
                            setEditedOneRepMax(newOneRepMax.toString());
                        }
                        setCompletedSets(new Array(workout.length).fill(false));
                        createHistoryEntries();
                    },
                },
            ]);
        }
    };

    const calculateSetWeight = (set: Set) => {
        let weight = (set.relativeWeight * (exercise?.oneRepMax || 1)) / 100;
        weight = Math.floor(weight / 2.5) * 2.5;
        return weight;
    };

    const handleDeleteEntry = useCallback(
        (entryToDelete: StrengthExerciseHistoryEntry) => {
            Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: () => {
                        const index = exerciseHistory[exerciseId].findIndex(
                            (item) => item.id === entryToDelete.id
                        );
                        if (index !== -1) {
                            deleteExerciseHistoryEntry(exerciseId, index);
                        }
                        swipeableRefs.current.forEach((ref) => ref?.close());
                    },
                    style: "destructive",
                },
            ]);
        },
        [deleteExerciseHistoryEntry, exerciseId, exerciseHistory]
    );

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    type WorkoutSection = {
        title: string;
        data: StrengthExerciseHistoryEntry[] | Set[];
        isHistory: boolean;
        date: Date;
        isHistoryTitle?: boolean;
    };

    const allWorkouts = useMemo(() => {
        const history = exerciseHistory[exerciseId] || [];
        const groupedHistory = history.reduce((acc, entry) => {
            const date = new Date(entry.date);
            const dateKey = date.toISOString().split("T")[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            if (entry.category === "strength") {
                acc[dateKey].push(entry as StrengthExerciseHistoryEntry);
            }
            return acc;
        }, {} as Record<string, StrengthExerciseHistoryEntry[]>);

        const historySections: WorkoutSection[] = Object.entries(groupedHistory).map(
            ([dateKey, entries]) => ({
                title: new Date(dateKey).toLocaleDateString(),
                data: entries,
                isHistory: true,
                date: new Date(dateKey),
            })
        );

        const currentWorkout: WorkoutSection = {
            title: "Current Workout",
            data: workout,
            isHistory: false,
            date: new Date(),
        };

        const historyTitle: WorkoutSection = {
            title: "History",
            data: [],
            isHistory: true,
            isHistoryTitle: true,
            date: new Date(0),
        };

        return [currentWorkout, ...historySections, historyTitle].sort((a, b) => {
            if (a.isHistory === b.isHistory) {
                if (a.isHistoryTitle) return 1;
                if (b.isHistoryTitle) return -1;
                return b.date.getTime() - a.date.getTime();
            }
            return a.isHistory ? 1 : -1;
        });
    }, [exerciseHistory, exerciseId, workout]);

    const renderItem = useCallback(
        ({
            item,
            section,
            index,
        }: {
            item: Set | StrengthExerciseHistoryEntry;
            section: { isHistory: boolean };
            index: number;
        }) => {
            const isCurrentWorkout = !section.isHistory;
            const setItem = isCurrentWorkout ? (item as Set) : null;
            const historyItem = !isCurrentWorkout ? (item as StrengthExerciseHistoryEntry) : null;

            const content = (
                <View>
                    <Text style={styles.setText}>
                        {isCurrentWorkout
                            ? setItem!.isAMRAP && amrapReps[workout.indexOf(setItem!)]
                                ? `${
                                      amrapReps[workout.indexOf(setItem!)]
                                  } reps @ ${calculateSetWeight(setItem!)} kg`
                                : `${setItem!.reps}${
                                      setItem!.isAMRAP ? "+" : ""
                                  } reps @ ${calculateSetWeight(setItem!)} kg`
                            : `${historyItem!.reps} reps @ ${historyItem!.weight} kg`}
                    </Text>
                    <Text style={styles.percentText}>
                        {isCurrentWorkout ? `${setItem!.relativeWeight}%` : ""}
                    </Text>
                </View>
            );

            if (isCurrentWorkout) {
                return (
                    <TouchableOpacity
                        style={styles.setItem}
                        onPress={() => toggleSet(workout.indexOf(setItem!))}
                    >
                        {content}
                        <View style={styles.iconContainer}>
                            {completedSets[workout.indexOf(setItem!)] ? (
                                <Icon
                                    name="checkmark-circle"
                                    size={24}
                                    color={currentTheme.colors.primary}
                                />
                            ) : (
                                <View style={styles.placeholderIcon} />
                            )}
                        </View>
                    </TouchableOpacity>
                );
            } else {
                return (
                    <Swipeable
                        ref={(el) => (swipeableRefs.current[index] = el)}
                        renderRightActions={() => (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteEntry(historyItem!)}
                            >
                                <Icon name="trash-outline" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                        rightThreshold={40}
                    >
                        <View style={styles.setItem}>
                            {content}
                            <View style={styles.iconContainer}>
                                <Icon
                                    name="checkmark-circle"
                                    size={24}
                                    color={currentTheme.colors.primary}
                                />
                            </View>
                        </View>
                    </Swipeable>
                );
            }
        },
        [
            currentTheme.colors.primary,
            amrapReps,
            completedSets,
            toggleSet,
            calculateSetWeight,
            workout,
            handleDeleteEntry,
        ]
    );

    const renderSectionHeader = useCallback(
        ({ section: { title, isHistory } }: { section: { title: string; isHistory: boolean } }) =>
            isHistory ? (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{title}</Text>
                </View>
            ) : null,
        []
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{exercise?.name}</Text>
                <TouchableOpacity onPress={handleEdit1RM} style={styles.oneRepMaxContainer}>
                    <Text style={styles.oneRepMaxLabel}> 1 RM: </Text>
                    {isEditing1RM ? (
                        <TextInput
                            ref={inputRef}
                            style={styles.oneRepMaxValue}
                            value={editedOneRepMax}
                            onChangeText={setEditedOneRepMax}
                            keyboardType="numeric"
                            onBlur={handleSave1RM}
                            onSubmitEditing={handleSave1RM}
                        />
                    ) : (
                        <Text style={styles.oneRepMaxValue}>
                            {exercise?.oneRepMax?.toFixed(0) || "N/A"}
                        </Text>
                    )}
                    <Text style={styles.oneRepMaxValue}> kg</Text>
                </TouchableOpacity>
            </View>

            <SectionList
                sections={allWorkouts}
                renderItem={renderItem}
                keyExtractor={(item, index) => ("id" in item ? item.id : index.toString())}
                contentContainerStyle={styles.listContainer}
                renderSectionHeader={renderSectionHeader}
            />
        </SafeAreaView>
    );
};

export default NSunsHistoryScreen;
