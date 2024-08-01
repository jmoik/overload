// screens/ExerciseHistoryScreen.tsx
import React, { useState, useRef, useCallback } from "react";
import { View, Text, FlatList, Button, TextInput, StyleSheet, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { ExerciseHistoryScreenRouteProp } from "../types/navigation";
import { ExerciseHistoryEntry } from "../models/Exercise";

const ExerciseHistoryScreen = () => {
    const route = useRoute<ExerciseHistoryScreenRouteProp>();
    const { exerciseId } = route.params;
    const {
        exercises,
        exerciseHistory,
        addExerciseToHistory,
        updateExerciseHistoryEntry,
        deleteExerciseHistoryEntry,
    } = useExerciseContext();
    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const { oneRepMaxFormula } = useExerciseContext();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    const exercise = exercises.find((e) => e.id === exerciseId);
    const history = exerciseHistory[exerciseId] || [];

    const calculateOneRepMax = (weight: number, reps: number): number => {
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

    const handleAddOrUpdateEntry = () => {
        if (!sets.trim() || !reps.trim() || !weight.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        const entry: ExerciseHistoryEntry = {
            date: editingIndex !== null ? history[editingIndex].date : new Date(),
            sets: parseInt(sets, 10),
            reps: parseInt(reps, 10),
            weight: parseFloat(weight),
        };

        if (editingIndex !== null) {
            updateExerciseHistoryEntry(exerciseId, editingIndex, entry);
            setEditingIndex(null);
        } else {
            addExerciseToHistory(exerciseId, entry);
        }

        setSets("");
        setReps("");
        setWeight("");
    };

    const handleEditEntry = (entry: ExerciseHistoryEntry, index: number) => {
        setEditingIndex(index);
        setSets(entry.sets.toString());
        setReps(entry.reps.toString());
        setWeight(entry.weight.toString());
    };

    const handleDeleteEntry = useCallback(
        (index: number) => {
            Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: () => {
                        // Clear editing state if we're deleting the entry being edited
                        if (editingIndex === index) {
                            setEditingIndex(null);
                            setSets("");
                            setReps("");
                            setWeight("");
                        }
                        deleteExerciseHistoryEntry(exerciseId, index);
                        swipeableRefs.current.forEach((ref) => ref?.close());
                    },
                    style: "destructive",
                },
            ]);
        },
        [deleteExerciseHistoryEntry, exerciseId, editingIndex]
    );

    const renderRightActions = useCallback((index: number) => {
        return (
            <View style={styles.deleteButton}>
                <Icon name="trash-outline" size={24} color="#FFFFFF" />
            </View>
        );
    }, []);

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{exercise.name} History</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Sets"
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Reps"
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Weight"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                />
            </View>
            <Button
                title={editingIndex !== null ? "Update Entry" : "Add to History"}
                onPress={handleAddOrUpdateEntry}
            />
            <FlatList
                data={[...history].reverse()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <Swipeable
                        ref={(el) => (swipeableRefs.current[index] = el)}
                        renderRightActions={() => renderRightActions(index)}
                        onSwipeableRightOpen={() => handleDeleteEntry(history.length - 1 - index)}
                        rightThreshold={40}
                    >
                        <View
                            style={styles.historyItem}
                            onTouchEnd={() => handleEditEntry(item, history.length - 1 - index)}
                        >
                            <View style={styles.historyItemContent}>
                                <View>
                                    <Text>{new Date(item.date).toLocaleDateString()}</Text>
                                    <Text>
                                        {item.sets} sets x {item.reps} reps @ {item.weight} kg
                                    </Text>
                                </View>
                                <Text style={styles.oneRepMax}>
                                    1RM: {calculateOneRepMax(item.weight, item.reps)} kg
                                </Text>
                            </View>
                        </View>
                    </Swipeable>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: "row",
        marginBottom: 20,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginRight: 10,
        borderRadius: 5,
    },
    historyItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        marginBottom: 10,
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        height: "100%",
    },
    historyItemContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    oneRepMax: {
        color: "#666",
        fontWeight: "bold",
    },
});

export default ExerciseHistoryScreen;
