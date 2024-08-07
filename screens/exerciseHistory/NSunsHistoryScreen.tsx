// NSunsHistoryScreen.tsx

import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import { Set } from "../../models/Exercise";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme, createExerciseHistoryStyles } from "../../styles/globalStyles";

interface NSunsHistoryScreenProps {
    exerciseId: string;
}

const NSunsHistoryScreen: React.FC<NSunsHistoryScreenProps> = ({ exerciseId }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createExerciseHistoryStyles(currentTheme);

    const { exercises } = useExerciseContext();

    const exercise = exercises.find((e) => e.id === exerciseId);
    const workout: Set[] = exercise?.workout || [];

    const [completedSets, setCompletedSets] = useState<boolean[]>(() =>
        new Array(workout.length).fill(false)
    );

    const toggleSet = (index: number) => {
        setCompletedSets((prev) => {
            const newCompletedSets = [...prev];
            newCompletedSets[index] = !newCompletedSets[index];
            return newCompletedSets;
        });
    };

    const renderSet = useCallback(
        ({ item, index }: { item: Set; index: number }) => (
            <TouchableOpacity style={localStyles.setItem} onPress={() => toggleSet(index)}>
                <Text style={localStyles.setText}>
                    {`${item.reps} reps at ${item.weight.toFixed(1)} kg`}
                </Text>
                {completedSets[index] && (
                    <Icon name="checkmark-circle" size={24} color={currentTheme.colors.primary} />
                )}
            </TouchableOpacity>
        ),
        [completedSets, currentTheme.colors.primary]
    );

    if (!exercise) {
        return <Text>Exercise not found</Text>;
    }

    console.log("exercise", exercise.workout);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{exercise.name}</Text>
            </View>
            <FlatList
                data={workout}
                renderItem={renderSet}
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    );
};

const localStyles = StyleSheet.create({
    setItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    setText: {
        fontSize: 16,
    },
});

export default NSunsHistoryScreen;
