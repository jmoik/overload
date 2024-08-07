// EnduranceHistoryScreen.tsx
import React, { useState, useRef, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import BaseHistoryScreen from "./BaseHistoryScreen";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { EnduranceExerciseHistoryEntry, ExerciseHistoryEntry } from "../../models/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";

interface EnduranceHistoryScreenProps {
    exerciseId: string;
}

const EnduranceHistoryScreen: React.FC<EnduranceHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);

    const [distance, setDistance] = useState("");
    const [time, setTime] = useState("");
    const [avgHeartRate, setAvgHeartRate] = useState("");
    const [rpe, setRpe] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [editingEntry, setEditingEntry] = useState<EnduranceExerciseHistoryEntry | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const {
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        exerciseHistory,
        meanRpe,
    } = useExerciseContext();

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleEditEntry = (entry: ExerciseHistoryEntry) => {
        const enduranceEntry = entry as EnduranceExerciseHistoryEntry;
        setEditingEntry(enduranceEntry);
        setRpe(enduranceEntry.rpe.toString());
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
                    style={[styles.input, styles.smallInput]}
                    placeholder="Avg Heart Rate (bpm)"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={avgHeartRate}
                    onChangeText={setAvgHeartRate}
                    keyboardType="numeric"
                />
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="RPE"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={rpe}
                    onChangeText={setRpe}
                    keyboardType="numeric"
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
            <View style={styles.inputRow}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                    <Text style={styles.dateButtonText}>
                        {editingEntry ? "Change Date: " : "Date: "}
                        {date.toLocaleDateString()}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}
            </View>
        </View>
    );

    const resetForm = () => {
        setDistance("");
        setTime("");
        setAvgHeartRate("");
        setRpe("");
        setNotes("");
        setDate(new Date());
        setEditingEntry(null);
        setShowDatePicker(false);
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
                            {`${item_.distance} km in ${item_.time} min (RPE ${item_.rpe})`}
                            {item_.avgHeartRate && ` @ ${item_.avgHeartRate} bpm`}
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
        const parsedRpe = rpe ? parseInt(rpe) : meanRpe;

        if (
            isNaN(parsedDistance) ||
            isNaN(parsedTime) ||
            (parsedAvgHeartRate && isNaN(parsedAvgHeartRate)) ||
            isNaN(parsedRpe)
        ) {
            Alert.alert(
                "Error",
                "Please enter valid numbers for Distance, Time, Heart Rate, and RPE"
            );
            return;
        }

        const entryWithoutId: Omit<EnduranceExerciseHistoryEntry, "id"> = {
            date: editingEntry ? date : new Date(),
            distance: parsedDistance,
            time: parsedTime,
            avgHeartRate: parsedAvgHeartRate,
            rpe: parsedRpe,
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
            setRpe(lastWorkout.rpe.toString());
            setNotes(lastWorkout.notes);
        }
    }, [exerciseHistory, exerciseId]);

    return (
        <BaseHistoryScreen
            exerciseId={exerciseId}
            renderInputFields={renderInputFields}
            renderHistoryItem={renderHistoryItem}
            handleAddOrUpdateEntry={handleAddOrUpdateEntry}
            fillFromLastWorkout={fillFromLastWorkout}
            editingEntry={editingEntry}
            styles={styles}
        />
    );
};

export default EnduranceHistoryScreen;
