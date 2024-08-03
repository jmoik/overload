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
import { ExerciseHistoryEntry } from "../models/Exercise";
import * as DocumentPicker from "expo-document-picker";

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
        const exportData = {
            exercises: exercises.map((exercise) => ({
                ...exercise,
                history: exerciseHistory[exercise.id] || [],
            })),
        };

        try {
            const jsonString = JSON.stringify(exportData, null, 2);
            await Share.share({
                message: jsonString,
                title: "Workout Routine Export",
            });
        } catch (error) {
            console.error("Error sharing export data:", error);
        }
    };

    const importData = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });

            if (result.canceled === false) {
                const fileContent = await fetch(result.assets[0].uri).then((res) => res.text());
                const importedData = JSON.parse(fileContent);

                // Validate the data structure
                if (!Array.isArray(importedData.exercises)) {
                    throw new Error("Invalid data format");
                }

                // Update app state
                setExercises(
                    importedData.exercises.map(
                        (e: {
                            id: any;
                            name: any;
                            description: any;
                            weeklySets: any;
                            targetRPE: any;
                            category: any;
                        }) => ({
                            id: e.id,
                            name: e.name,
                            description: e.description,
                            weeklySets: e.weeklySets,
                            targetRPE: e.targetRPE,
                            category: e.category,
                        })
                    )
                );

                const newHistory = {};
                importedData.exercises.forEach((e: { history: any; id: string | number }) => {
                    if (Array.isArray(e.history)) {
                        newHistory[e.id] = e.history;
                    }
                });
                setExerciseHistory(newHistory);

                Alert.alert("Success", "Data imported successfully");
            }
        } catch (error) {
            console.error("Error importing data:", error);
            Alert.alert("Error", "Failed to import data. Please check the file format.");
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
        { id: "9", title: "Import Data", action: importData },
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
