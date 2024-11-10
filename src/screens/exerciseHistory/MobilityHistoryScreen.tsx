// MobilityHistoryScreen.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import BaseHistoryScreen from "./BaseHistoryScreen";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { MobilityExerciseHistoryEntry, ExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";
import { useNavigation } from "@react-navigation/native";

interface MobilityHistoryScreenProps {
    exerciseId: string;
}

const MobilityHistoryScreen: React.FC<MobilityHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);
    const navigation = useNavigation();

    const [sets, setSets] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [editingEntry, setEditingEntry] = useState<MobilityExerciseHistoryEntry | null>(null);

    const {
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        exerciseHistory,
        exercises,
    } = useExerciseContext();

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);
    const exercise = exercises.find((e) => e.id === exerciseId);

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    useEffect(() => {
        if (exercise) {
            navigation.setOptions({ title: exercise.name });
        }
        fillFromLastWorkout();
    }, [exercise, navigation]);

    const handleEditEntry = (entry: ExerciseHistoryEntry) => {
        const mobilityEntry = entry as MobilityExerciseHistoryEntry;
        setEditingEntry(mobilityEntry);
        setDate(new Date(mobilityEntry.date));
        setNotes(mobilityEntry.notes || "");
        setSets(mobilityEntry.sets.toString());
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
            />
            <TouchableOpacity style={styles.button} onPress={() => incrementValue(setter, value)}>
                <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
        </View>
    );

    const renderInputFields = () => (
        <View>
            <View style={styles.inputRowInputFields}>
                {renderInputWithButtons(sets, setSets, "Sets")}
            </View>
            <View style={styles.notesAndDateRow}>
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder="Notes"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
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
        const item_ = item as MobilityExerciseHistoryEntry;
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
                            {`${item_.sets} sets`}
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
        if (!sets.trim()) {
            Alert.alert("Error", "Please fill in the Sets field");
            return;
        }

        const parsedSets = parseInt(sets);

        if (isNaN(parsedSets)) {
            Alert.alert("Error", "Please enter valid numbers for Sets");
            return;
        }

        const entryWithoutId: Omit<MobilityExerciseHistoryEntry, "id"> = {
            date: date,
            notes: notes.trim(),
            category: "mobility",
            sets: parsedSets,
        };

        const entry: MobilityExerciseHistoryEntry = {
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
    };

    const fillFromLastWorkout = useCallback(() => {
        const history = exerciseHistory[exerciseId] || [];
        if (history.length > 0) {
            const lastWorkout = history[0] as MobilityExerciseHistoryEntry;
            setSets(lastWorkout.sets.toString());
            setNotes(lastWorkout.notes);
        }
    }, [exerciseHistory, exerciseId]);

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

export default MobilityHistoryScreen;
