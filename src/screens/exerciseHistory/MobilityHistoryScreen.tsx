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
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { MobilityExerciseHistoryEntry, ExerciseHistoryEntry } from "../../contexts/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";
import { useNavigation } from "@react-navigation/native";

interface MobilityHistoryScreenProps {
    exerciseId: string;
}

interface GroupedEntries {
    [date: string]: MobilityExerciseHistoryEntry[];
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
        Keyboard.dismiss();
    };

    const fillFromLastWorkout = useCallback(() => {
        const history = exerciseHistory[exerciseId] || [];
        if (history.length > 0) {
            const lastWorkout = history[0] as MobilityExerciseHistoryEntry;
            setSets(lastWorkout.sets.toString());
            setNotes(lastWorkout.notes);
        }
    }, [exerciseHistory, exerciseId]);

    const groupEntriesByDate = (entries: ExerciseHistoryEntry[]): GroupedEntries => {
        return entries.reduce((groups: GroupedEntries, entry) => {
            const date = new Date(entry.date).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry as MobilityExerciseHistoryEntry);
            return groups;
        }, {});
    };

    const renderHistoryItem = (item: MobilityExerciseHistoryEntry, index: number) => {
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
                        {`${item.sets} sets`}
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

    const renderInputFields = () => (
        <View style={styles.inputSection}>
            <View style={styles.inputRowInputFields}>
                {renderInputWithButtons(sets, setSets, "Sets")}
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
            <ScrollView style={styles.historyListContainer}>
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

export default MobilityHistoryScreen;
