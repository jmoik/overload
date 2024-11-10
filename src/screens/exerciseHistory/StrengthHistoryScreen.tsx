import React, { useState, useRef, useCallback, useEffect } from "react";
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
import BaseHistoryScreen from "./BaseHistoryScreen";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { StrengthExerciseHistoryEntry, ExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";
import { useNavigation } from "@react-navigation/native";

interface StrengthHistoryScreenProps {
    exerciseId: string;
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

    const {
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        exerciseHistory,
        exercises,
    } = useExerciseContext();

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

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
            <TouchableOpacity style={styles.button} onPress={() => decrementValue(setter, value)}>
                <Text style={styles.buttonText}>-</Text>
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
            <TouchableOpacity style={styles.button} onPress={() => incrementValue(setter, value)}>
                <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
        </View>
    );

    const renderInputFields = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <View style={styles.inputRowInputFields}>
                            {renderInputWithButtons(sets, setSets, "Sets")}
                            {renderInputWithButtons(reps, setReps, "Reps")}
                            {renderInputWithButtons(weight, setWeight, "Weight", "decimal-pad")}
                        </View>
                        <View style={styles.notesAndDateRow}>
                            <TextInput
                                style={[styles.input, styles.notesInput]}
                                placeholder="Notes"
                                placeholderTextColor={currentTheme.colors.placeholder}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                returnKeyType="done"
                                onSubmitEditing={Keyboard.dismiss}
                            />
                            <View style={styles.datePickerContainer}>
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
                            {`${item_.sets} sets x ${item_.reps} reps @ ${
                                item_.weight > 0 ? item_.weight + " kg" : "BW"
                            }`}
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
        if (!sets.trim() || !reps.trim()) {
            Alert.alert("Error", "Please fill in Sets and Reps");
            return;
        }

        const parsedSets = parseInt(sets);
        const parsedReps = parseInt(reps);
        const parsedWeight = weight.trim() ? parseFloat(weight.replace(",", ".")) : 0;

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
        const history = exerciseHistory[exerciseId] || [];
        if (history.length > 0) {
            const lastWorkout = history[0] as StrengthExerciseHistoryEntry;
            setSets(lastWorkout.sets.toString());
            setReps(lastWorkout.reps.toString());
            setWeight(lastWorkout.weight > 0 ? lastWorkout.weight.toString() : "");
            setNotes(lastWorkout.notes);
        }
    }, [exerciseHistory, exerciseId]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <BaseHistoryScreen
                exerciseId={exerciseId}
                renderInputFields={renderInputFields}
                renderHistoryItem={renderHistoryItem}
                handleAddOrUpdateEntry={handleAddOrUpdateEntry}
                editingEntry={editingEntry}
                styles={styles}
            />
        </KeyboardAvoidingView>
    );
};

export default StrengthHistoryScreen;
