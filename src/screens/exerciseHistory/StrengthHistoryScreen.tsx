// StrengthHistoryScreen.tsx
import React, { useState, useRef, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import BaseHistoryScreen from "./BaseHistoryScreen";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { StrengthExerciseHistoryEntry, ExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";

interface StrengthHistoryScreenProps {
    exerciseId: string;
}

const StrengthHistoryScreen: React.FC<StrengthHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);
    const [date, setDate] = useState<Date>(new Date());
    const [editingEntry, setEditingEntry] = useState<StrengthExerciseHistoryEntry | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [notes, setNotes] = useState("");

    const {
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        exerciseHistory,
    } = useExerciseContext();

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleEditEntry = (entry: ExerciseHistoryEntry) => {
        const strengthEntry = entry as StrengthExerciseHistoryEntry;
        setEditingEntry(strengthEntry);
        setDate(new Date(strengthEntry.date));
        setNotes(strengthEntry.notes || "");
        setSets(strengthEntry.sets.toString());
        setReps(strengthEntry.reps.toString());
        setWeight(strengthEntry.weight.toString());
    };

    const renderInputFields = () => (
        <View>
            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Sets"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="numeric"
                />
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Reps"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="numeric"
                />
                <TextInput
                    style={[styles.input, styles.smallInput]}
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

    const renderHistoryItem = ({ item, index }: { item: ExerciseHistoryEntry; index: number }) => {
        const item_ = item as StrengthExerciseHistoryEntry;
        // show date in european format
        const currentDate = new Date(item_.date).toLocaleDateString();
        const previousDate =
            index > 0
                ? new Date(exerciseHistory[exerciseId][index - 1].date)
                      .toLocaleDateString()
                      .split("T")[0]
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
                            {`${item_.sets} sets x ${item_.reps} reps @ ${item_.weight} kg`}
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
        if (!sets.trim() || !reps.trim() || !weight.trim()) {
            Alert.alert("Error", "Please fill in all required fields (Sets, Reps, and Weight)");
            return;
        }

        const parsedSets = parseInt(sets);
        const parsedReps = parseInt(reps);
        const parsedWeight = parseFloat(weight.replace(",", "."));

        if (isNaN(parsedSets) || isNaN(parsedReps) || isNaN(parsedWeight)) {
            Alert.alert("Error", "Please enter valid numbers for Sets, Reps, and Weight");
            return;
        }

        const entryWithoutId: Omit<StrengthExerciseHistoryEntry, "id"> = {
            date: date,
            notes: notes.trim(),
            sets: parsedSets,
            reps: parsedReps,
            weight: parsedWeight,
            category: "strength",
        };

        const entry: StrengthExerciseHistoryEntry = {
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
        setNotes("");
        setDate(new Date());
        setSets("");
        setReps("");
        setWeight("");
        setShowDatePicker(false);
    };

    const fillFromLastWorkout = useCallback(() => {
        const history = exerciseHistory[exerciseId] || [];
        if (history.length > 0) {
            const lastWorkout = history[0] as StrengthExerciseHistoryEntry;
            setSets(lastWorkout.sets.toString());
            setReps(lastWorkout.reps.toString());
            setWeight(lastWorkout.weight.toString());
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

export default StrengthHistoryScreen;
