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
import { Set, StrengthExerciseHistoryEntry } from "../../models/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createNsunsExerciseHistoryStyles } from "../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";

interface NSunsHistoryScreenProps {
    exerciseId: string;
}

const NSunsHistoryScreen: React.FC<NSunsHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createNsunsExerciseHistoryStyles(currentTheme);
    const { exerciseHistory } = useExerciseContext();

    const { exercises, updateExercise, addExerciseToHistory, meanRpe } = useExerciseContext();
    const [exercise, setExercise] = useState(exercises.find((e) => e.id === exerciseId));
    const [isEditing1RM, setIsEditing1RM] = useState(false);
    const [editedOneRepMax, setEditedOneRepMax] = useState(exercise?.oneRepMax?.toString() || "");
    const inputRef = useRef<TextInput>(null);
    const [amrapReps, setAmrapReps] = useState<{ [key: number]: string }>({});

    const workout: Set[] = exercise?.workout || [];

    const [completedSets, setCompletedSets] = useState<boolean[]>(() =>
        new Array(workout.length).fill(false)
    );

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
                rpe: meanRpe,
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
                "numeric" // This sets the keyboard type to numeric
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

        // round to nearest 2.5kg
        weight = Math.floor(weight / 2.5) * 2.5;

        return weight;
    };

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    const allWorkouts = useMemo(() => {
        const history = exerciseHistory[exerciseId] || [];
        const groupedHistory = history.reduce((acc, entry) => {
            const date = new Date(entry.date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(entry);
            return acc;
        }, {} as Record<string, StrengthExerciseHistoryEntry[]>);

        const historySections = Object.entries(groupedHistory).map(([date, entries]) => ({
            title: date,
            data: entries,
            isHistory: true,
        }));

        const currentWorkout = {
            title: "Current Workout",
            data: workout,
            isHistory: false,
        };

        const historyTitle = {
            title: "History",
            data: [],
            isHistory: true,
            isHistoryTitle: true,
        };

        return [currentWorkout, historyTitle, ...historySections].sort((a, b) =>
            a.isHistory === b.isHistory ? b.title.localeCompare(a.title) : a.isHistory ? 1 : -1
        );
    }, [exerciseHistory, exerciseId, workout]);

    const renderItem = useCallback(
        ({
            item,
            section,
        }: {
            item: Set | StrengthExerciseHistoryEntry;
            section: { isHistory: boolean };
        }) => {
            const isCurrentWorkout = !section.isHistory;
            const setItem = isCurrentWorkout ? (item as Set) : null;
            const historyItem = !isCurrentWorkout ? (item as StrengthExerciseHistoryEntry) : null;

            return (
                <TouchableOpacity
                    style={styles.setItem}
                    onPress={() => (isCurrentWorkout ? toggleSet(workout.indexOf(setItem!)) : null)}
                >
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
                            {isCurrentWorkout
                                ? `${setItem!.relativeWeight.toFixed(0)}% of 1 RM`
                                : `RPE: ${historyItem!.rpe}`}
                        </Text>
                    </View>
                    <View style={styles.iconContainer}>
                        {(isCurrentWorkout && completedSets[workout.indexOf(setItem!)]) ||
                        !isCurrentWorkout ? (
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
        },
        [
            currentTheme.colors.primary,
            amrapReps,
            completedSets,
            toggleSet,
            calculateSetWeight,
            workout,
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
