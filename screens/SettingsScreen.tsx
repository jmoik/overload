// screens/SettingsScreen.tsx
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share, Switch } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { SettingsScreenNavigationProp } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createSettingsStyles } from "../styles/globalStyles";

type SettingItem = {
    id: string;
    title: string;
    action: () => void;
    isSwitch?: boolean;
};

const SettingsScreen = () => {
    const { theme, toggleTheme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createSettingsStyles(currentTheme);
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
        { id: "2", title: "Export Data", action: shareExportData },
        { id: "3", title: "Rest Timer", action: () => navigation.navigate("RestTimer") },
        {
            id: "4",
            title: "Training Interval",
            action: () => navigation.navigate("TrainingInterval"),
        },
        {
            id: "5",
            title: "Dark Mode",
            action: () => {}, // This will be handled by the Switch component
            isSwitch: true,
        },
    ];
    const renderItem = ({ item }: { item: SettingItem }) => (
        <TouchableOpacity style={styles.settingItem} onPress={item.action}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.isSwitch ? (
                <Switch
                    value={theme === "dark"}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#767577", true: currentTheme.colors.primary }}
                    thumbColor={theme === "dark" ? currentTheme.colors.background : "#f4f3f4"}
                />
            ) : (
                <Icon
                    name="chevron-forward-outline"
                    size={24}
                    color={currentTheme.colors.primary}
                />
            )}
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

export default SettingsScreen;
