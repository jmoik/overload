import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    Alert,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    Keyboard,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { EnduranceExerciseHistoryEntry, ExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";
import AppleHealthKit, {
    HealthInputOptions,
    HKWorkoutQueriedSampleType,
} from "react-native-health";
import { useNavigation } from "@react-navigation/native";
import { useHealthKit } from "../../contexts/HealthKitContext";

interface EnduranceHistoryScreenProps {
    exerciseId: string;
}

interface GroupedEntries {
    [date: string]: EnduranceExerciseHistoryEntry[];
}

const EnduranceHistoryScreen: React.FC<EnduranceHistoryScreenProps> = ({ exerciseId }) => {
    const { isHealthKitAuthorized } = useHealthKit();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);
    const navigation = useNavigation();

    const [distance, setDistance] = useState("");
    const [time, setTime] = useState("");
    const [avgHeartRate, setAvgHeartRate] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [editingEntry, setEditingEntry] = useState<EnduranceExerciseHistoryEntry | null>(null);

    const {
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        exerciseHistory,
        exercises,
    } = useExerciseContext();

    const scrollViewRef = useRef<ScrollView>(null);
    useLayoutEffect(() => {
        if (exerciseHistory[exerciseId]?.length) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [exerciseHistory, exerciseId]);

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    const exercise = exercises.find((e) => e.id === exerciseId);
    const exerciseName = exercise ? exercise.name : "Endurance";

    useEffect(() => {
        if (exercise) {
            // Set up the navigation header with title and import button
            navigation.setOptions({
                title: exercise.name,
                headerRight: () => (
                    <TouchableOpacity onPress={checkForNewWorkouts} style={{ marginRight: 15 }}>
                        <Icon
                            name="cloud-download-outline"
                            size={24}
                            color={currentTheme.colors.text}
                        />
                    </TouchableOpacity>
                ),
            });
        }
        fillFromLastWorkout();
    }, [exercise, theme]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleEditEntry = (entry: ExerciseHistoryEntry) => {
        const enduranceEntry = entry as EnduranceExerciseHistoryEntry;
        setEditingEntry(enduranceEntry);
        setDate(new Date(enduranceEntry.date));
        setNotes(enduranceEntry.notes || "");
        setDistance(enduranceEntry.distance.toString());
        setTime(enduranceEntry.time.toString());
        setAvgHeartRate(enduranceEntry.avgHeartRate?.toString() || "");
    };

    const incrementValue = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        value: string
    ) => {
        const currentValue = value.trim() === "" ? 0 : parseFloat(value);
        const newValue = isNaN(currentValue) ? 1 : currentValue + 1;
        setter(newValue.toString());
    };

    const decrementValue = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        value: string
    ) => {
        const currentValue = value.trim() === "" ? 2 : parseFloat(value);
        const newValue = isNaN(currentValue) ? 1 : Math.max(1, currentValue - 1);
        setter(newValue.toString());
    };

    const renderInputWithButtons = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        placeholder: string,
        keyboardType: "numeric" | "decimal-pad" = "numeric"
    ) => (
        <View style={styles.container2}>
            <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => decrementValue(setter, value)}
            >
                <Text style={styles.incrementButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
                style={styles.inputt}
                placeholder={placeholder}
                placeholderTextColor={currentTheme.colors.placeholder}
                value={value}
                onChangeText={setter}
                keyboardType={keyboardType}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
            />
            <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementValue(setter, value)}
            >
                <Text style={styles.incrementButtonText}>+</Text>
            </TouchableOpacity>
        </View>
    );

    const handleDeleteEntry = useCallback(
        (entryToDelete: ExerciseHistoryEntry) => {
            Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: () => {
                        const index = exerciseHistory[exerciseId].findIndex(
                            (item) => item === entryToDelete
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

    const groupEntriesByDate = (entries: ExerciseHistoryEntry[]): GroupedEntries => {
        return entries.reduce((groups: GroupedEntries, entry) => {
            const date = new Date(entry.date).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry as EnduranceExerciseHistoryEntry);
            return groups;
        }, {});
    };

    const renderHistoryItem = (item: EnduranceExerciseHistoryEntry, index: number) => {
        const paceMinutes = item.time > 0 ? Math.floor(item.time / item.distance).toFixed(0) : "0";
        const paceSeconds = item.time > 0 ? ((item.time * 60) / item.distance) % 60 : 0;
        const pace = `${paceMinutes}\'${paceSeconds < 10 ? "0" : ""}${Math.round(paceSeconds)}\"`;

        return (
            <Swipeable
                ref={(el) => (swipeableRefs.current[index] = el)}
                key={item.id}
                renderRightActions={() => (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteEntry(item)}
                    >
                        <Icon name="trash-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
                rightThreshold={40}
            >
                <TouchableOpacity style={styles.historyItem} onPress={() => handleEditEntry(item)}>
                    <Text style={styles.text}>
                        {`${item.distance.toFixed(2)} km in ${item.time.toFixed(0)} min`}
                        {item.avgHeartRate && ` @ ${item.avgHeartRate} bpm`}
                        {` @ ${pace}`}
                        {item.notes && (
                            <Text style={styles.notes}>
                                {"\n"}
                                {item.notes}
                            </Text>
                        )}
                    </Text>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    const handleAddOrUpdateEntry = () => {
        if (!distance.trim() || !time.trim()) {
            Alert.alert("Error", "Please fill in at least Distance and Time fields");
            return;
        }

        const parsedDistance = parseFloat(distance.replace(",", "."));
        const parsedTime = parseFloat(time.replace(",", "."));
        const parsedAvgHeartRate = avgHeartRate ? parseInt(avgHeartRate) : undefined;

        if (
            isNaN(parsedDistance) ||
            isNaN(parsedTime) ||
            (parsedAvgHeartRate && isNaN(parsedAvgHeartRate))
        ) {
            Alert.alert("Error", "Please enter valid numbers for Distance and Time");
            return;
        }

        const entryWithoutId: Omit<EnduranceExerciseHistoryEntry, "id"> = {
            date: date,
            distance: parsedDistance,
            time: parsedTime,
            avgHeartRate: parsedAvgHeartRate,
            notes: notes.trim(),
            category: "endurance",
        };

        const entry: EnduranceExerciseHistoryEntry = {
            ...entryWithoutId,
            id: editingEntry ? editingEntry.id : generateEntryId(entryWithoutId),
        };

        if (editingEntry) {
            const index = exerciseHistory[exerciseId].findIndex(
                (item) => item.id === editingEntry.id
            );
            if (index !== -1) {
                updateExerciseHistoryEntry(exerciseId, index, entry);
            }
        } else {
            addExerciseToHistory(exerciseId, entry);
        }

        setEditingEntry(null);
        Keyboard.dismiss();
    };

    const fillFromLastWorkout = useCallback(() => {
        const history = exerciseHistory[exerciseId] || [];
        if (history.length > 0) {
            const lastWorkout = history[0] as EnduranceExerciseHistoryEntry;
            setDistance(lastWorkout.distance.toString());
            setTime(lastWorkout.time.toString());
            setAvgHeartRate(lastWorkout.avgHeartRate?.toString() || "");
            setNotes(lastWorkout.notes);
        }
    }, [exerciseHistory, exerciseId]);

    const renderInputFields = () => (
        <View style={styles.inputSection}>
            <View style={styles.inputRowInputFields}>
                {renderInputWithButtons(distance, setDistance, "Distance (km)", "decimal-pad")}
                {renderInputWithButtons(time, setTime, "Time (min)", "decimal-pad")}
            </View>
            <View style={styles.notesAndDateRow}>
                <TextInput
                    style={styles.notesInput}
                    placeholder="Notes"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                />
                <View
                    style={[
                        styles.datePickerContainer,
                        theme === "dark" && { backgroundColor: "#444444" }, // or any other dark gray color
                    ]}
                >
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                </View>
            </View>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handleAddOrUpdateEntry}
            >
                <Text style={[styles.buttonText, { color: "#fff" }]}>
                    {editingEntry ? "Update Entry" : "Add Entry"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderHistoryList = () => {
        const sortedHistory = [...(exerciseHistory[exerciseId] || [])].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const groupedEntries = groupEntriesByDate(sortedHistory);

        return (
            <ScrollView ref={scrollViewRef} style={styles.historyListContainer}>
                {Object.entries(groupedEntries).map(([date, entries]) => (
                    <View key={date}>
                        <Text style={styles.dateHeader}>{date}</Text>
                        {entries.map((entry, index) => renderHistoryItem(entry, index))}
                    </View>
                ))}
            </ScrollView>
        );
    };

    const checkForNewWorkouts = () => {
        if (Platform.OS === "ios" && isHealthKitAuthorized) {
            const options: HealthInputOptions = {
                startDate: new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString(),
                type: AppleHealthKit.Constants.Permissions.Workout,
                includeManuallyAdded: true,
            };

            console.log("Fetching workouts with options:", JSON.stringify(options));

            AppleHealthKit.getAnchoredWorkouts(options, (err, results) => {
                if (err) {
                    console.log("Error fetching workouts:", JSON.stringify(err));
                    Alert.alert("Error", "Could not access Health data");
                    return;
                }

                console.log("Raw workout data:", JSON.stringify(results, null, 2));

                const runningWorkouts = results.data.filter(
                    (workout: HKWorkoutQueriedSampleType) => workout.activityName === "Running"
                );

                const processedWorkouts = runningWorkouts.map((workout) => {
                    const startDate = new Date(workout.start);
                    const endDate = new Date(workout.end);

                    return {
                        startDate,
                        endDate,
                        distance: isNaN(workout.distance) ? 0 : workout.distance * 1.60934,
                        duration: isNaN(workout.duration) ? 0 : workout.duration,
                        activityName: workout.activityName || "Unknown",
                    };
                });

                console.log("Workouts:", processedWorkouts);

                const sortedWorkouts = processedWorkouts.sort(
                    (a, b) => a.startDate.getTime() - b.startDate.getTime()
                );

                const existingEntries = exerciseHistory[exerciseId] || [];
                const newWorkouts = sortedWorkouts.filter((workout) => {
                    const workoutDate = new Date(workout.startDate);
                    const existingEntry = existingEntries.find((entry) => {
                        const entryDate = new Date(entry.date);
                        workoutDate.setHours(0, 0, 0, 0);
                        return (
                            entryDate.getTime() === workoutDate.getTime() &&
                            Math.abs(
                                (entry as EnduranceExerciseHistoryEntry).distance - workout.distance
                            ) < 0.1
                        );
                    });
                    return !existingEntry;
                });

                if (newWorkouts.length > 0) {
                    const workoutList = newWorkouts
                        .map(
                            (workout) =>
                                `${workout.startDate.toLocaleDateString()}: ${workout.distance.toFixed(
                                    2
                                )} km, ${(workout.duration / 60).toFixed(0)} min`
                        )
                        .join("\n");

                    Alert.alert(
                        "Import New Workouts",
                        `Found ${newWorkouts.length} new ${exerciseName} workouts:\n\n${workoutList}\n\nDo you want to import them?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Import",
                                onPress: () => importFilteredWorkouts(newWorkouts),
                            },
                        ]
                    );
                } else {
                    Alert.alert("No New Workouts", "No new workouts found to import.");
                }
            });
        } else if (Platform.OS === "ios" && !isHealthKitAuthorized) {
            Alert.alert(
                "Health Access Required",
                "Please enable Health access in your device settings to import workouts.",
                [{ text: "OK" }]
            );
        }
    };

    const importFilteredWorkouts = (workouts: any[]) => {
        workouts.forEach((workout) => {
            const entry: EnduranceExerciseHistoryEntry = {
                id: generateEntryId({
                    date: workout.startDate,
                    distance: workout.distance,
                    time: workout.duration / 60,
                    category: "endurance",
                }),
                date: workout.startDate,
                distance: Number(workout.distance.toFixed(3)),
                time: Math.round(workout.duration / 60),
                avgHeartRate: isNaN(workout.averageHeartRate)
                    ? undefined
                    : Math.round(workout.averageHeartRate),
                notes: `Imported from Health app: ${workout.activityName}${
                    workout.combinedCount > 1
                        ? ` (Combined from ${workout.combinedCount} workouts)`
                        : ""
                }`,
                category: "endurance",
            };
            addExerciseToHistory(exerciseId, entry);
        });

        Alert.alert("Success", `${workouts.length} new workouts have been imported.`);
    };

    const resetForm = () => {
        setEditingEntry(null);
        setDistance("");
        setTime("");
        setAvgHeartRate("");
        setNotes("");
        setDate(new Date());
        Keyboard.dismiss();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            {renderHistoryList()}
            {renderInputFields()}
        </KeyboardAvoidingView>
    );
};

export default EnduranceHistoryScreen;
