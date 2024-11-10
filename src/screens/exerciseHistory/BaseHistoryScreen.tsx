import React from "react";
import {
    View,
    Button,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
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
        <View style={[styles.container, { flex: 1 }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <FlatList
                        style={[styles.historyList, { flex: 1 }]}
                        data={history.sort(
                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                        )}
                        renderItem={({ item, index }) => renderHistoryItem({ item, index })}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    />
                    <View style={styles.separator} />
                    <View
                        style={[
                            styles.inputSection,
                            { paddingBottom: Platform.OS === "ios" ? 20 : 0 },
                        ]}
                    >
                        {renderInputFields()}
                        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                            <Button
                                title={editingEntry ? "Update Entry" : "Add to History"}
                                onPress={handleAddOrUpdateEntry}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default BaseHistoryScreen;
