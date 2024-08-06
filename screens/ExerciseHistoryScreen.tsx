// screens/ExerciseHistoryScreen.tsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    Button,
    TextInput,
    Alert,
    TouchableOpacity,
    Dimensions,
    Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import { LineChart } from "react-native-chart-kit";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { ExerciseHistoryScreenRouteProp } from "../types/navigation";
import { ExerciseHistoryEntry } from "../models/Exercise";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../styles/globalStyles";
import { set } from "date-fns";

const ExerciseHistoryScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);
    const route = useRoute<ExerciseHistoryScreenRouteProp>();
    const { exerciseId } = route.params;
    const {
        exercises,
        exerciseHistory,
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        timerRunning,
        timeLeft,
        startTimer,
        stopTimer,
        meanRpe,
    } = useExerciseContext();

    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");
    const [rpe, setRpe] = useState("");
    const [weight, setWeight] = useState("");
    const [distance, setDistance] = useState("");
    const [time, setTime] = useState("");
    const [avgHeartRate, setAvgHeartRate] = useState("");
    const [Notes, setNotes] = useState("");

    const [date, setDate] = useState(new Date());
    const { oneRepMaxFormula } = useExerciseContext();
    const [editingEntry, setEditingEntry] = useState<ExerciseHistoryEntry | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const swipeableRefs = useRef<(Swipeable | null)[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const parseFloatNumbers = (input: string): number => {
        // Replace comma with dot and parse
        return parseFloat(input.replace(",", "."));
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const exercise = exercises.find((e) => e.id === exerciseId);
    const history = exerciseHistory[exerciseId] || [];

    const calculateOneRepMax = (weight: number | undefined, reps: number | undefined): number => {
        if (weight === undefined || reps === undefined) {
            return 0;
        }

        switch (oneRepMaxFormula) {
            case "brzycki":
                return Math.floor(weight / (1.0278 - 0.0278 * reps));
            case "epley":
                return Math.floor(weight * (1 + 0.0333 * reps));
            case "lander":
                return Math.floor((100 * weight) / (101.3 - 2.67123 * reps));
            default:
                return 0;
        }
    };

    const oneRepMaxData = useMemo(() => {
        return history
            .filter((entry) => entry.rpe !== undefined && entry.rpe >= meanRpe)
            .map((entry) => ({
                date: new Date(entry.date),
                oneRepMax: calculateOneRepMax(entry.weight, entry.reps),
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [history, calculateOneRepMax, meanRpe]);

    const enduranceData = useMemo(() => {
        return history
            .filter((entry) => entry.distance)
            .map((entry) => ({
                date: new Date(entry.date),
                distance: entry.distance,
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [history]);

    const chartData = {
        labels: oneRepMaxData.map((data) => data.date.toLocaleDateString().slice(0, -4)),
        datasets: [
            {
                data: oneRepMaxData.map((data) => data.oneRepMax),
            },
        ],
    };

    const enduranceChartData = {
        labels: enduranceData.map((data) => data.date.toLocaleDateString().slice(0, -4)),
        datasets: [
            {
                data: enduranceData.map((data) => data.distance),
            },
        ],
    };

    const fillFromLastWorkout = useCallback(() => {
        if (history.length > 0) {
            const lastWorkout = history[0];
            if (exercise?.category === "endurance") {
                setDistance(lastWorkout.distance?.toString() || "");
                setTime(lastWorkout.time?.toString() || "");
                setAvgHeartRate(lastWorkout.avgHeartRate?.toString() || "");
            } else if (exercise?.category === "mobility") {
                setSets(lastWorkout.sets?.toString() ?? "");
            } else if (exercise?.category === "nsuns") {
                if (lastWorkout.setsArray && lastWorkout.setsArray.length > 0) {
                    const lastSet = lastWorkout.setsArray[lastWorkout.setsArray.length - 1];
                    setReps(lastSet.reps.toString());
                    setWeight(lastSet.weight.toString());
                    setRpe(lastSet.rpe.toString());
                }
            } else {
                setSets(lastWorkout.sets?.toString() ?? "");
                setReps(lastWorkout.reps?.toString() ?? "");
                setWeight(lastWorkout.weight?.toString() ?? "");
            }
            setRpe(lastWorkout.rpe.toString());
            setNotes(lastWorkout.notes || "");
        }
    }, [history, exercise]);

    const resetForm = () => {
        setSets("");
        setReps("");
        setWeight("");
        setRpe("");
        setDistance("");
        setTime("");
        setAvgHeartRate("");
        setDate(new Date());
        setEditingEntry(null);
        setNotes("");
    };

    const handleAddOrUpdateEntry = () => {
        if (!exercise) {
            Alert.alert("Error", "Exercise not found");
            return;
        }

        let entry: ExerciseHistoryEntry = {
            notes: Notes,
            date: editingEntry ? date : new Date(),
            rpe: parseInt(rpe, 10) || exercise.targetRPE,
            setsArray: [],
        };

        if (exercise.category === "endurance") {
            if (!distance.trim() || !time.trim()) {
                Alert.alert("Error", "Please fill in at least distance and time");
                return;
            }
            entry = {
                ...entry,
                distance: parseFloatNumbers(distance),
                time: parseFloatNumbers(time),
                avgHeartRate: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
            };
        } else if (exercise.category === "mobility") {
            if (!sets.trim()) {
                Alert.alert("Error", "Please fill in all fields");
                return;
            }
            entry = {
                ...entry,
                sets: parseInt(sets, 10),
            };
        } else if (exercise.category === "nsuns") {
            if (!reps.trim() || !weight.trim()) {
                Alert.alert("Error", "Please fill in all fields");
                return;
            }
            entry = {
                ...entry,
                setsArray: entry.setsArray
                    ? [
                          ...entry.setsArray,
                          {
                              reps: parseInt(reps, 10),
                              weight: parseFloatNumbers(weight),
                              rpe: parseInt(rpe, 10),
                              notes: Notes,
                          },
                      ]
                    : [
                          {
                              reps: parseInt(reps, 10),
                              weight: parseFloatNumbers(weight),
                              rpe: parseInt(rpe, 10),
                              notes: Notes,
                          },
                      ],
            };
        } else {
            if (!sets.trim() || !reps.trim() || !weight.trim()) {
                Alert.alert("Error", "Please fill in all fields");
                return;
            }
            entry = {
                ...entry,
                sets: parseInt(sets, 10),
                reps: parseInt(reps, 10),
                weight: parseFloatNumbers(weight),
            };
        }

        if (editingEntry) {
            const index = history.findIndex((item) => item === editingEntry);
            if (index !== -1) {
                updateExerciseHistoryEntry(exerciseId, index, entry);
            }
        } else {
            addExerciseToHistory(exerciseId, entry);
        }

        resetForm();
    };

    const handleDeleteEntry = useCallback(
        (entryToDelete: ExerciseHistoryEntry) => {
            Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: () => {
                        const index = history.findIndex((item) => item === entryToDelete);
                        if (index !== -1) {
                            deleteExerciseHistoryEntry(exerciseId, index);
                            if (editingEntry === entryToDelete) {
                                resetForm();
                            }
                        }
                        swipeableRefs.current.forEach((ref) => ref?.close());
                    },
                    style: "destructive",
                },
            ]);
        },
        [deleteExerciseHistoryEntry, exerciseId, editingEntry, history]
    );

    const handleEditEntry = (entry: ExerciseHistoryEntry) => {
        setEditingEntry(entry);
        if (exercise?.category === "endurance") {
            setDistance(entry.distance?.toString() || "");
            setTime(entry.time?.toString() || "");
            setAvgHeartRate(entry.avgHeartRate?.toString() || "");
        } else if (exercise?.category === "mobility") {
            setSets(entry.sets?.toString() || "");
        } else if (exercise?.category === "nsuns") {
            if (entry.setsArray && entry.setsArray.length > 0) {
                const lastSet = entry.setsArray[entry.setsArray.length - 1];
                setReps(lastSet.reps.toString());
                setWeight(lastSet.weight.toString());
                setRpe(lastSet.rpe.toString());
            }
        } else {
            setSets(entry.sets?.toString() || "");
            setReps(entry.reps?.toString() || "");
            setWeight(entry.weight?.toString() || "");
        }
        setRpe(entry.rpe.toString());
        setDate(new Date(entry.date));
        setNotes(entry.notes || "");
    };

    const renderHistoryItem = ({ item, index }: { item: ExerciseHistoryEntry; index: number }) => {
        const currentDate = new Date(item.date).toLocaleDateString();
        const previousDate =
            index > 0 ? new Date(history[index - 1].date).toLocaleDateString() : null;

        return (
            <>
                {(index === 0 || currentDate !== previousDate) && (
                    <Text style={styles.dateHeader}>{currentDate}</Text>
                )}
                <Swipeable
                    ref={(el) => (swipeableRefs.current[index] = el)}
                    renderRightActions={() => renderDeleteButton(item)}
                    rightThreshold={40}
                >
                    <TouchableOpacity
                        style={styles.historyItem}
                        onPress={() => handleEditEntry(item)}
                    >
                        <Text style={styles.text}>
                            {renderExerciseDetails(item)}
                            {renderNotes(item)}
                        </Text>
                        {renderOneRepMax(item)}
                    </TouchableOpacity>
                </Swipeable>
            </>
        );
    };

    const renderDeleteButton = (item: ExerciseHistoryEntry) => (
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEntry(item)}>
            <Icon name="trash-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    );

    const renderExerciseDetails = (item: ExerciseHistoryEntry) => {
        switch (exercise?.category) {
            case "endurance":
                return `${item.distance} km in ${item.time} min${
                    item.avgHeartRate ? ` @ ${item.avgHeartRate} bpm` : ""
                } (RPE ${item.rpe})`;
            case "mobility":
                return `${item.sets} sets (RPE ${item.rpe})`;
            case "nsuns":
                return item.setsArray
                    .map(
                        (set) =>
                            `${set.reps} reps @ ${set.weight} kg (RPE ${set.rpe}) ${
                                set.notes ? ` - ${set.notes}` : ""
                            }`
                    )
                    .join("\n");
            default:
                return `${item.sets} sets x ${item.reps} reps @ ${item.weight} kg (RPE ${item.rpe})`;
        }
    };

    const renderNotes = (item: ExerciseHistoryEntry) =>
        item.notes ? (
            <Text style={styles.notes}>
                {"\n"} {item.notes}
            </Text>
        ) : null;

    const renderOneRepMax = (item: ExerciseHistoryEntry) =>
        exercise?.category !== "endurance" && exercise?.category !== "mobility" ? (
            <Text style={styles.oneRepMax}>
                1RM:{" "}
                {calculateOneRepMax(
                    exercise?.category === "nsuns" && Array.isArray(item.sets)
                        ? item.sets[0].weight
                        : item.weight!,
                    exercise?.category === "nsuns" && Array.isArray(item.sets)
                        ? item.sets[0].reps
                        : item.reps!
                )}{" "}
                kg
            </Text>
        ) : null;

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{exercise?.name}</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={fillFromLastWorkout} style={styles.fillButton}>
                        <Icon name="copy-outline" size={25} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={timerRunning ? stopTimer : startTimer}>
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerText}>{timeLeft}</Text>
                            <Icon
                                name={timerRunning ? "pause" : "play"}
                                size={20}
                                color="#007AFF"
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {renderInputFields()}

            {editingEntry && (
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                    <Text>Change Date: {date.toLocaleDateString()}</Text>
                </TouchableOpacity>
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            <Button
                title={editingEntry ? "Update Entry" : "Add to History"}
                onPress={handleAddOrUpdateEntry}
            />

            <FlatList
                data={history.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => index.toString()}
            />

            {renderProgressChart()}
        </View>
    );

    function renderInputFields() {
        const commonFields = (
            <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={Notes}
                onChangeText={setNotes}
                multiline
            />
        );

        switch (exercise?.category) {
            case "endurance":
                return (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Distance (km)"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={distance}
                            onChangeText={setDistance}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Time (min)"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={time}
                            onChangeText={setTime}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Avg Heart Rate"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={avgHeartRate}
                            onChangeText={setAvgHeartRate}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="RPE"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={rpe}
                            onChangeText={setRpe}
                            keyboardType="numeric"
                        />
                        {commonFields}
                    </View>
                );
            case "mobility":
                return (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Sets"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={sets}
                            onChangeText={setSets}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="RPE"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={rpe}
                            onChangeText={setRpe}
                            keyboardType="numeric"
                        />
                        {commonFields}
                    </View>
                );
            case "nsuns":
                return (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Reps"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={reps}
                            onChangeText={setReps}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Weight"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={weight}
                            onChangeText={(text) => {
                                if (/^\d*[.,]?\d*$/.test(text)) {
                                    setWeight(text);
                                }
                            }}
                            keyboardType="decimal-pad"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="RPE"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={rpe}
                            onChangeText={setRpe}
                            keyboardType="numeric"
                        />
                        {commonFields}
                    </View>
                );
            default:
                return (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Sets"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={sets}
                            onChangeText={setSets}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Reps"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={reps}
                            onChangeText={setReps}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Weight"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={weight}
                            onChangeText={(text) => {
                                if (/^\d*[.,]?\d*$/.test(text)) {
                                    setWeight(text);
                                }
                            }}
                            keyboardType="decimal-pad"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="RPE"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={rpe}
                            onChangeText={setRpe}
                            keyboardType="numeric"
                        />
                        {commonFields}
                    </View>
                );
        }
    }
    function renderProgressChart() {
        const chartConfig = {
            backgroundColor: "#e26a00",
            backgroundGradientFrom: "#fb8c00",
            backgroundGradientTo: "#ffa726",
            decimalPlaces: exercise?.category === "endurance" ? 1 : 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#ffa726" },
        };

        const chartStyle = {
            marginVertical: 5,
            borderRadius: 16,
        };

        switch (exercise?.category) {
            case "endurance":
                return (
                    <>
                        <Text style={styles.sectionTitle}>Distance Progress</Text>
                        {enduranceData.length > 1 ? (
                            <LineChart
                                data={enduranceChartData}
                                width={Dimensions.get("window").width - 30}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=" km"
                                chartConfig={chartConfig}
                                bezier
                                style={chartStyle}
                            />
                        ) : (
                            <Text>Not enough data to show distance evolution</Text>
                        )}
                    </>
                );
            case "mobility":
                return null;
            default:
                return (
                    <>
                        <Text style={styles.sectionTitle}>1RM Progress</Text>
                        {oneRepMaxData.length > 1 ? (
                            <LineChart
                                data={chartData}
                                width={Dimensions.get("window").width - 30}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=" kg"
                                chartConfig={chartConfig}
                                bezier
                                style={chartStyle}
                            />
                        ) : (
                            <Text>Not enough data to show 1RM evolution</Text>
                        )}
                    </>
                );
        }
    }
};

export default ExerciseHistoryScreen;
