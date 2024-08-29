// EnduranceHistoryScreen.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import BaseHistoryScreen from "./BaseHistoryScreen";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { EnduranceExerciseHistoryEntry, ExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";
import AppleHealthKit, {
    HealthInputOptions,
    HealthKitPermissions,
    HKWorkoutQueriedSampleType,
} from "react-native-health";
import { useNavigation } from "@react-navigation/native";

interface EnduranceHistoryScreenProps {
    exerciseId: string;
}

const permissions: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.StepCount,
        ],
        write: [],
    },
};

const EnduranceHistoryScreen: React.FC<EnduranceHistoryScreenProps> = ({ exerciseId }) => {
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
    const [isHealthKitAuthorized, setIsHealthKitAuthorized] = useState(false);

    const {
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        exerciseHistory,
        exercises,
    } = useExerciseContext();

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    const exercise = exercises.find((e) => e.id === exerciseId);
    const exerciseName = exercise ? exercise.name : "Endurance";

    const initializeHealthKit = () => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
            if (error) {
                console.log("[ERROR] Cannot initialize HealthKit:", error);
            } else {
                console.log("HealthKit initialized successfully");
                setIsHealthKitAuthorized(true);
                checkForNewWorkouts();
            }
        });
    };

    if (Platform.OS === "ios" && !isHealthKitAuthorized) {
        initializeHealthKit();
    }

    useEffect(() => {
        if (exercise) {
            navigation.setOptions({ title: exercise.name });
        }
        fillFromLastWorkout();
    }, [exercise, navigation]);

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

    const renderInputFields = () => (
        <View>
            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Distance (km)"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={distance}
                    onChangeText={setDistance}
                    keyboardType="decimal-pad"
                />
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Time (minutes)"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={time}
                    onChangeText={setTime}
                    keyboardType="decimal-pad"
                />
            </View>
            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder="Notes"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                />
            </View>
            <View>
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            </View>
        </View>
    );

    const resetForm = () => {
        setDistance("");
        setTime("");
        setAvgHeartRate("");
        setNotes("");
        setDate(new Date());
        setEditingEntry(null);
    };

    const handleDeleteEntry = useCallback(
        (entryToDelete: ExerciseHistoryEntry) => {
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
                            if (editingEntry && editingEntry.id === entryToDelete.id) {
                                resetForm();
                            }
                        }
                        swipeableRefs.current.forEach((ref) => ref?.close());
                    },
                    style: "destructive",
                },
            ]);
        },
        [deleteExerciseHistoryEntry, exerciseId, exerciseHistory, editingEntry]
    );

    const renderHistoryItem = ({ item, index }: { item: ExerciseHistoryEntry; index: number }) => {
        const item_ = item as EnduranceExerciseHistoryEntry;
        const currentDate = new Date(item_.date).toLocaleDateString();
        const previousDate =
            index > 0
                ? new Date(exerciseHistory[exerciseId][index - 1].date).toLocaleDateString()
                : null;
        const paceMinutes =
            item_.time > 0 ? Math.floor(item_.time / item_.distance).toFixed(0) : "0";
        const paceSeconds = item_.time > 0 ? ((item_.time * 60) / item_.distance) % 60 : 0;
        const pace = `${paceMinutes}\'${paceSeconds < 10 ? "0" : ""}${Math.round(paceSeconds)}\"`;

        return (
            <>
                {(index === 0 || currentDate !== previousDate) && (
                    <Text style={styles.dateHeader}>{currentDate}</Text>
                )}
                <Swipeable
                    ref={(el) => (swipeableRefs.current[index] = el)}
                    key={item_.id}
                    renderRightActions={() => (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteEntry(item_)}
                        >
                            <Icon name="trash-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                    rightThreshold={40}
                >
                    <TouchableOpacity
                        style={styles.historyItem}
                        onPress={() => handleEditEntry(item_)}
                    >
                        <Text style={styles.text}>
                            {`${item_.distance.toFixed(2)} km in ${item_.time.toFixed(0)} min`}
                            {item_.avgHeartRate && ` @ ${item_.avgHeartRate} bpm`}
                            {` @ ${pace}`}
                            {item_.notes && (
                                <Text style={styles.notes}>
                                    {"\n"}
                                    {item_.notes}
                                </Text>
                            )}
                        </Text>
                    </TouchableOpacity>
                </Swipeable>
            </>
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

        resetForm();
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

    const checkForNewWorkouts = () => {
        if (Platform.OS === "ios") {
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

                // print workouts
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
                }
            });
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

    return (
        <BaseHistoryScreen
            exerciseId={exerciseId}
            renderInputFields={renderInputFields}
            renderHistoryItem={renderHistoryItem}
            handleAddOrUpdateEntry={handleAddOrUpdateEntry}
            editingEntry={editingEntry}
            styles={styles}
        />
    );
};

export default EnduranceHistoryScreen;
