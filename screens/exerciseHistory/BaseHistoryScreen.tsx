// BaseHistoryScreen.tsx
import React from "react";
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { ExerciseHistoryEntry } from "../../contexts/Exercise";

interface BaseHistoryScreenProps {
    exerciseId: string;
    renderInputFields: () => React.ReactNode;
    renderHistoryItem: ({
        item,
        index,
    }: {
        item: ExerciseHistoryEntry;
        index: number;
    }) => React.ReactNode;
    handleAddOrUpdateEntry: () => void;
    fillFromLastWorkout: () => void;
    editingEntry: ExerciseHistoryEntry | null;
    styles: StyleSheet.NamedStyles<any>;
}

const BaseHistoryScreen: React.FC<BaseHistoryScreenProps> = ({
    exerciseId,
    renderInputFields,
    renderHistoryItem,
    handleAddOrUpdateEntry,
    fillFromLastWorkout,
    editingEntry,
    styles,
}) => {
    const { exercises, exerciseHistory, timerRunning, timeLeft, startTimer, stopTimer, meanRpe } =
        useExerciseContext();

    const exercise = exercises.find((e) => e.id === exerciseId);
    const history = exerciseHistory[exerciseId] || [];

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{exercise.name}</Text>
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

            <Button
                title={editingEntry ? "Update Entry" : "Add to History"}
                onPress={handleAddOrUpdateEntry}
            />
            <FlatList
                data={history.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )}
                renderItem={({ item, index }) => {
                    return <>{renderHistoryItem({ item, index })}</>;
                }}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
};

export default BaseHistoryScreen;
