// screens/SettingsScreen.tsx
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { RootStackParamList, SettingsScreenNavigationProp } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";

type SettingItem = {
    id: string;
    title: string;
    action: () => void;
};

const SettingsScreen = () => {
    const navigation = useNavigation<SettingsScreenNavigationProp>();
    const { exercises, exerciseHistory } = useExerciseContext();

    const shareExportData = async () => {
        let exportData = "Workout Routine Export\n\n";

        exercises.forEach((exercise) => {
            exportData += `Exercise: ${exercise.name}\n`;
            exportData += `Description: ${exercise.description}\n`;
            exportData += `Sets per week: ${exercise.setsPerWeek}\n`;
            exportData += `Category: ${exercise.category}\n\n`;

            exportData += "Workout History:\n";
            const history = exerciseHistory[exercise.id] || [];
            history.forEach((entry) => {
                exportData += `Date: ${new Date(entry.date).toLocaleDateString()}, `;
                exportData += `Sets: ${entry.sets}, `;
                exportData += `Reps: ${entry.reps}, `;
                exportData += `Weight: ${entry.weight}kg\n`;
            });
            exportData += "\n";
        });

        try {
            await Share.share({
                message: exportData,
                title: "Workout Routine Export",
            });
        } catch (error) {
            console.error("Error sharing export data:", error);
        }
    };

    const settingsOptions: SettingItem[] = [
        {
            id: "1",
            title: "One Rep Max Formula",
            action: () => navigation.navigate("OneRepMaxFormula"),
        },
        { id: "2", title: "Rest Timer", action: () => navigation.navigate("RestTimer") },
        { id: "3", title: "Export Data", action: shareExportData },
    ];

    const renderItem = ({ item }: { item: SettingItem }) => (
        <TouchableOpacity style={styles.settingItem} onPress={item.action}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Icon name="chevron-forward-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={settingsOptions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0",
    },
    settingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    settingTitle: {
        fontSize: 16,
    },
});

export default SettingsScreen;
