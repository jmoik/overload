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

    const [date, setDate] = useState(new Date());
    const { oneRepMaxFormula } = useExerciseContext();
    const [editingEntry, setEditingEntry] = useState<ExerciseHistoryEntry | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const swipeableRefs = useRef<(Swipeable | null)[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
            .filter((entry) => entry.rpe !== undefined && entry.rpe >= meanRpe) // Only include entries with default RPE or higher
            .map((entry) => ({
                date: new Date(entry.date),
                oneRepMax: calculateOneRepMax(entry.weight, entry.reps),
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [history, calculateOneRepMax, meanRpe]);

    const enduranceData = useMemo(() => {
        return (
            history
                // .filter((entry) => entry.rpe !== undefined && entry.rpe >= meanRpe) // Only include entries with default RPE or higher
                .filter((entry) => entry.distance)
                .map((entry) => ({
                    date: new Date(entry.date),
                    distance: entry.distance,
                }))
                .sort((a, b) => a.date.getTime() - b.date.getTime())
        );
    }, [history, meanRpe]);

    const chartData = {
        labels: oneRepMaxData.map((data) => data.date.toLocaleDateString()),
        datasets: [
            {
                data: oneRepMaxData.map((data) => data.oneRepMax),
            },
        ],
    };

    const enduranceChartData = {
        labels: enduranceData.map((data) => data.date.toLocaleDateString()),
        datasets: [
            {
                data: enduranceData.map((data) => data.distance),
            },
        ],
    };

    const fillFromLastWorkout = useCallback(() => {
        if (history.length > 0) {
            const lastWorkout = history[0];
            setSets(lastWorkout.sets?.toString() ?? "");
            setReps(lastWorkout.reps?.toString() ?? "");
            setWeight(lastWorkout.weight?.toString() ?? "");
            setRpe(lastWorkout.rpe.toString());
            setDistance(lastWorkout.distance?.toString() || "");
            setTime(lastWorkout.time?.toString() || "");
            setAvgHeartRate(lastWorkout.avgHeartRate?.toString() || "");
        }
    }, [history]);

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
    };

    const handleAddOrUpdateEntry = () => {
        if (!exercise) {
            Alert.alert("Error", "Exercise not found");
            return;
        }

        let entry: ExerciseHistoryEntry;

        if (exercise.category === "endurance") {
            if (!distance.trim() || !time.trim()) {
                Alert.alert("Error", "Please fill in at least distance and time");
                return;
            }
            entry = {
                date: editingEntry ? date : new Date(),
                distance: parseFloat(distance),
                time: parseFloat(time),
                avgHeartRate: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
                rpe: parseInt(rpe, 10) || exercise.targetRPE,
            };
        } else {
            if (!sets.trim() || !reps.trim() || !weight.trim()) {
                Alert.alert("Error", "Please fill in all fields");
                return;
            }
            entry = {
                date: editingEntry ? date : new Date(),
                sets: parseInt(sets, 10),
                reps: parseInt(reps, 10),
                weight: parseFloat(weight),
                rpe: parseInt(rpe, 10) || exercise.targetRPE,
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

    const handleEditEntry = (entry: ExerciseHistoryEntry) => {
        setEditingEntry(entry);
        if (exercise?.category === "endurance") {
            setDistance(entry.distance?.toString() || "");
            setTime(entry.time?.toString() || "");
            setAvgHeartRate(entry.avgHeartRate?.toString() || "");
        } else {
            setSets(entry.sets?.toString() || "");
            setReps(entry.reps?.toString() || "");
            setWeight(entry.weight?.toString() || "");
        }
        setRpe(entry.rpe.toString());
        setDate(new Date(entry.date));
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === "ios");
        setDate(currentDate);
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

    const renderHistoryItem = ({ item, index }: { item: ExerciseHistoryEntry; index: number }) => (
        <Swipeable
            ref={(el) => (swipeableRefs.current[index] = el)}
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
                    {new Date(item.date).toLocaleDateString()}
                    {"\n"}
                    {exercise?.category === "endurance"
                        ? `${item.distance} km in ${item.time} min${
                              item.avgHeartRate ? ` @ ${item.avgHeartRate} bpm` : ""
                          } ${`(RPE ${item.rpe})`} `
                        : `${item.sets} sets x ${item.reps} reps @ ${
                              item.weight
                          } kg${`(RPE ${item.rpe})`}`}
                </Text>
                {exercise?.category !== "endurance" && (
                    <Text style={styles.oneRepMax}>
                        1RM: {calculateOneRepMax(item.weight!, item.reps!)} kg
                    </Text>
                )}
            </TouchableOpacity>
        </Swipeable>
    );

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{exercise?.name}</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={fillFromLastWorkout} style={styles.fillButton}>
                        <Icon name="arrow-up" size={25} color="#007AFF" />
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

            {exercise.category === "endurance" ? (
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
                </View>
            ) : (
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
                        onChangeText={setWeight}
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
                </View>
            )}
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
                data={history.sort((a: ExerciseHistoryEntry, b: ExerciseHistoryEntry) => {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                })}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => index.toString()}
            />
            {exercise.category === "endurance" ? (
                <>
                    <Text style={styles.sectionTitle}>Distance Progress</Text>
                    {enduranceData.length > 1 ? (
                        <LineChart
                            data={enduranceChartData}
                            width={Dimensions.get("window").width - 30}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=" km"
                            chartConfig={{
                                backgroundColor: "#e26a00",
                                backgroundGradientFrom: "#fb8c00",
                                backgroundGradientTo: "#ffa726",
                                decimalPlaces: 1,
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                style: {
                                    borderRadius: 16,
                                },
                                propsForDots: {
                                    r: "4",
                                    strokeWidth: "2",
                                    stroke: "#ffa726",
                                },
                            }}
                            bezier
                            style={{
                                marginVertical: 5,
                                borderRadius: 16,
                            }}
                        />
                    ) : (
                        <Text></Text>
                    )}
                </>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>1RM Progress</Text>
                    {oneRepMaxData.length > 1 ? (
                        <LineChart
                            data={chartData}
                            width={Dimensions.get("window").width - 30}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=" kg"
                            chartConfig={{
                                backgroundColor: "#e26a00",
                                backgroundGradientFrom: "#fb8c00",
                                backgroundGradientTo: "#ffa726",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                style: {
                                    borderRadius: 16,
                                },
                                propsForDots: {
                                    r: "4",
                                    strokeWidth: "2",
                                    stroke: "#ffa726",
                                },
                            }}
                            bezier
                            style={{
                                marginVertical: 5,
                                borderRadius: 16,
                            }}
                        />
                    ) : (
                        <Text>Not enough data to show 1RM evolution</Text>
                    )}
                </>
            )}
        </View>
    );
};

export default ExerciseHistoryScreen;
