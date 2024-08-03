// screens/SettingsScreen.tsx
import React from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { View, Text, FlatList, TouchableOpacity, Share, Switch, Alert } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { SettingsScreenNavigationProp } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createSettingsStyles } from "../styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingItem = {
    id: string;
    title: string;
    action: () => void;
    isSwitch?: boolean;
    isDangerous?: boolean;
};

const SettingsScreen = () => {
    const { theme, toggleTheme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createSettingsStyles(currentTheme);
    const navigation = useNavigation<SettingsScreenNavigationProp>();
    const { exercises, exerciseHistory, setExercises, setExerciseHistory } = useExerciseContext();

    const shareExportData = async () => {
        let exportData = "Workout Routine Export\n\n";

        exercises.forEach((exercise) => {
            exportData += `Exercise: ${exercise.name}\n`;
            exportData += `Description: ${exercise.description}\n`;
            exportData += `Sets per week: ${exercise.weeklySets}\n`;
            exportData += `Target RPE: ${exercise.targetRPE}\n`;
            exportData += `Category: ${exercise.category}\n\n`;

            exportData += "Workout History:\n";
            const history = exerciseHistory[exercise.id] || [];
            history.forEach((entry) => {
                exportData += `Date: ${new Date(entry.date).toLocaleDateString()}, `;
                exportData += `Sets: ${entry.sets}, `;
                exportData += `Reps: ${entry.reps}, `;
                exportData += `Weight: ${entry.weight}kg\n`;
                exportData += `RPE: ${entry.rpe}\n\n`;
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

    const handleDeleteAllData = () => {
        Alert.alert(
            "Delete All Data",
            "Are you sure you want to delete all data? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            // Clear all data from AsyncStorage
                            await AsyncStorage.clear();

                            // Reset exercises and exercise history in context
                            setExercises([]);
                            setExerciseHistory({});

                            // Reset the app to the initial state
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: "Welcome" }],
                                })
                            );
                        } catch (error) {
                            console.error("Error deleting data:", error);
                            Alert.alert("Error", "Failed to delete data. Please try again.");
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    const resetWelcomeScreen = async () => {
        try {
            await AsyncStorage.setItem("alreadySetup", "false");
            Alert.alert(
                "Success",
                "Welcome screen has been reset. Please restart the app to see the changes.",
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error("Error resetting welcome screen:", error);
            Alert.alert("Error", "Failed to reset welcome screen.");
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
            title: "Default RPE",
            action: () => navigation.navigate("DefaultRpe"),
        },
        {
            id: "6",
            title: "Dark Mode",
            action: () => {}, // This will be handled by the Switch component
            isSwitch: true,
        },
        {
            id: "7",
            title: "Reset Welcome Screen",
            action: resetWelcomeScreen,
        },
        {
            id: "8",
            title: "Delete All Data",
            action: handleDeleteAllData,
            isDangerous: true,
        },
    ];

    const renderItem = ({ item }: { item: SettingItem }) => (
        <TouchableOpacity
            style={[styles.settingItem, item.isDangerous && styles.dangerousSettingItem]}
            onPress={item.action}
        >
            <Text style={[styles.settingTitle]}>{item.title}</Text>
            {item.isSwitch ? (
                <Switch
                    value={theme === "dark"}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#767577", true: currentTheme.colors.primary }}
                    thumbColor={theme === "dark" ? currentTheme.colors.background : "#f4f3f4"}
                />
            ) : (
                !item.isDangerous && (
                    <Icon
                        name="chevron-forward-outline"
                        size={24}
                        color={currentTheme.colors.primary}
                    />
                )
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
