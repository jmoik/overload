import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { StrengthExerciseHistoryEntry, ExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";
import { useNavigation } from "@react-navigation/native";

interface StrengthHistoryScreenProps {
    exerciseId: string;
}

interface GroupedEntries {
    [date: string]: StrengthExerciseHistoryEntry[];
}

const StrengthHistoryScreen: React.FC<StrengthHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);
    const [date, setDate] = useState<Date>(new Date());
    const [editingEntry, setEditingEntry] = useState<StrengthExerciseHistoryEntry | null>(null);

    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [notes, setNotes] = useState("");

    const navigation = useNavigation();
    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

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

    const exercise = exercises.find((e) => e.id === exerciseId);

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
        const strengthEntry = entry as StrengthExerciseHistoryEntry;
        setEditingEntry(strengthEntry);
        setDate(new Date(strengthEntry.date));
        setNotes(strengthEntry.notes || "");
        setSets(strengthEntry.sets.toString());
        setReps(strengthEntry.reps.toString());
        setWeight(strengthEntry.weight > 0 ? strengthEntry.weight.toString() : "");
    };

    // Round to nearest multiple of 2.5
    const floorToNearestStep = (value: number): number => {
        // Round to the nearest multiple of 2.5
        return Math.floor(value / 2.5) * 2.5;
    };
    const ceilToNearestStep = (value: number): number => {
        // Round to the nearest multiple of 2.5
        return Math.ceil(value / 2.5) * 2.5;
    };

    const incrementValue = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        value: string,
        field: string
    ) => {
        const currentValue = value.trim() === "" ? 0 : parseFloat(value);
        let newValue: number;

        if (field === "weight") {
            if (isNaN(currentValue)) {
                newValue = 2.5;
            } else {
                // First round to the nearest 2.5 multiple, then add 2.5
                const roundedValue = floorToNearestStep(currentValue);
                newValue = roundedValue + 2.5;
            }
            // Format to handle potential floating point issues
            newValue = Math.round(newValue * 10) / 10;
        } else {
            // For sets and reps, keep increment as 1
            newValue = isNaN(currentValue) ? 1 : currentValue + 1;
        }

        setter(newValue.toString());
    };

    const decrementValue = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        value: string,
        field: string
    ) => {
        const currentValue = value.trim() === "" ? 0 : parseFloat(value);
        let newValue: number;

        if (field === "weight") {
            if (isNaN(currentValue) || currentValue <= 2.5) {
                newValue = 0;
            } else {
                // First round to the nearest 2.5 multiple, then subtract 2.5
                const roundedValue = ceilToNearestStep(currentValue);
                newValue = Math.max(0, roundedValue - 2.5);
            }
            // Format to handle potential floating point issues
            newValue = Math.round(newValue * 10) / 10;
        } else {
            // For sets and reps, keep decrement as 1 with minimum of 1
            newValue = isNaN(currentValue) ? 1 : Math.max(1, currentValue - 1);
        }

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
                onPress={() => decrementValue(setter, value, placeholder.toLowerCase())}
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
                onPress={() => incrementValue(setter, value, placeholder.toLowerCase())}
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

    const handleAddOrUpdateEntry = () => {
        if (!sets.trim() || !reps.trim()) {
            Alert.alert("Error", "Please fill in Sets and Reps");
            return;
        }

        const parsedSets = parseInt(sets);
        const parsedReps = parseInt(reps);
        let parsedWeight = weight.trim() ? parseFloat(weight.replace(",", ".")) : 0;

        // Round weight to nearest 2.5
        if (parsedWeight > 0) {
            parsedWeight = Math.round(parsedWeight / 2.5) * 2.5;
            // Update the weight value in the UI to show the rounded value
            setWeight(parsedWeight.toString());
        }

        if (isNaN(parsedSets) || isNaN(parsedReps) || isNaN(parsedWeight)) {
            Alert.alert(
                "Error",
                "Please enter valid numbers for Sets, Reps, and Weight (if provided)"
            );
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
        Keyboard.dismiss();
    };

    const fillFromLastWorkout = useCallback(() => {
        const unsortedHistory = exerciseHistory[exerciseId] || [];
        const history = [...unsortedHistory].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        if (history.length > 0) {
            const lastWorkout = history[0] as StrengthExerciseHistoryEntry;
            setSets(lastWorkout.sets.toString());
            setReps(lastWorkout.reps.toString());
            setWeight(lastWorkout.weight > 0 ? lastWorkout.weight.toString() : "");
            setNotes(lastWorkout.notes);
        }
    }, [exerciseHistory, exerciseId]);

    const renderInputFields = () => (
        <View style={styles.inputSection}>
            <View style={styles.inputRowInputFields}>
                {renderInputWithButtons(sets, setSets, "Sets")}
                {renderInputWithButtons(reps, setReps, "Reps")}
                {renderInputWithButtons(weight, setWeight, "Weight", "decimal-pad")}
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

    const groupEntriesByDate = (entries: ExerciseHistoryEntry[]): GroupedEntries => {
        return entries.reduce((groups: GroupedEntries, entry) => {
            const date = new Date(entry.date).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry as StrengthExerciseHistoryEntry);
            return groups;
        }, {});
    };

    const renderHistoryItem = (item: StrengthExerciseHistoryEntry, index: number) => {
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
                        {`${item.sets} sets x ${item.reps} reps @ ${
                            item.weight > 0 ? item.weight + " kg" : "BW"
                        }`}
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

export default StrengthHistoryScreen;
