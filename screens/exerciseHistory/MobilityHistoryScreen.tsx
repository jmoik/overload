// MobilityHistoryScreen.tsx
import React, { useState, useRef, useCallback } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, FlatList } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import BaseHistoryScreen from "./BaseHistoryScreen";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import {
    MobilityExerciseHistoryEntry,
    ExerciseHistoryEntry,
    EnduranceExerciseHistoryEntry,
} from "../../models/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../styles/globalStyles";
import { generateEntryId } from "../../utils/utils";

interface MobilityHistoryScreenProps {
    exerciseId: string;
}

const MobilityHistoryScreen: React.FC<MobilityHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);

    const [sets, setSets] = useState("");
    const [rpe, setRpe] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(new Date());
    const [editingEntry, setEditingEntry] = useState<MobilityExerciseHistoryEntry | null>(null);

    const {
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
        exerciseHistory,
        meanRpe,
    } = useExerciseContext();

    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    const handleEditEntry = (entry: ExerciseHistoryEntry) => {
        const mobilityEntry = entry as MobilityExerciseHistoryEntry;
        setEditingEntry(mobilityEntry);
        setRpe(mobilityEntry.rpe.toString());
        setDate(mobilityEntry.date);
        setNotes(mobilityEntry.notes || "");
        setSets(mobilityEntry.sets.toString());
    };

    const renderInputFields = () => (
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
            <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={notes}
                onChangeText={setNotes}
                multiline
            />
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
        const currentDate = new Date(item_.date).toISOString().split("T")[0];
        const previousDate =
            index > 0
                ? new Date(exerciseHistory[exerciseId][index - 1].date).toISOString().split("T")[0]
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
                            {`${item_.sets} sets (RPE ${item_.rpe})`}
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
        // Validate required fields
        if (!sets.trim()) {
            Alert.alert("Error", "Please fill in the Sets field");
            return;
        }

        // Parse and validate numeric values
        const parsedSets = parseInt(sets);
        const parsedRpe = rpe ? parseInt(rpe) : meanRpe;

        if (isNaN(parsedSets) || isNaN(parsedRpe)) {
            Alert.alert("Error", "Please enter valid numbers for Sets and RPE");
            return;
        }

        const entryWithoutId: Omit<MobilityExerciseHistoryEntry, "id"> = {
            date: editingEntry ? new Date(date) : new Date(),
            rpe: parsedRpe,
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

        // Reset form
        setEditingEntry(null);
        setRpe("");
        setNotes("");
        setDate(new Date());
    };

    const fillFromLastWorkout = useCallback(() => {
        const history = exerciseHistory[exerciseId] || [];
        if (history.length > 0) {
            const lastWorkout = history[0] as MobilityExerciseHistoryEntry;
            setSets(lastWorkout.sets.toString());
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

export default MobilityHistoryScreen;
