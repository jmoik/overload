// BaseHistoryScreen.tsx
import React from "react";
import { View, Button, FlatList, StyleSheet } from "react-native";
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
    editingEntry: ExerciseHistoryEntry | null;
    styles: StyleSheet.NamedStyles<any>;
}

const BaseHistoryScreen: React.FC<BaseHistoryScreenProps> = ({
    exerciseId,
    renderInputFields,
    renderHistoryItem,
    handleAddOrUpdateEntry,
    editingEntry,
    styles,
}) => {
    const { exerciseHistory } = useExerciseContext();

    const history = exerciseHistory[exerciseId] || [];

    return (
        <View style={styles.container}>
            {renderInputFields()}

            <Button
                title={editingEntry ? "Update Entry" : "Add to History"}
                onPress={handleAddOrUpdateEntry}
            />

            <FlatList
                data={history.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )}
                renderItem={({ item, index }) => renderHistoryItem({ item, index })}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
};

export default BaseHistoryScreen;
