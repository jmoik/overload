// screens/SettingsScreen.tsx
import React from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Share,
    Switch,
    Alert,
    Linking,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { SettingsScreenNavigationProp } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createSettingsStyles } from "../styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { generateRandomWorkoutData } from "../utils/dataGenerators";

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

                            // Set alreadySetup to false
                            await AsyncStorage.setItem("alreadySetup", "false");

                            // Reset the app to the Welcome screen
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

    const handleEmailPress = () => {
        Linking.openURL("mailto:@opals.poet0m@icloud.com?subject=Feedback for Workout App");
    };

    const handleAppStoreRating = () => {
        // Replace 'your-app-id' with your actual App Store ID
        Linking.openURL("https://apps.apple.com/app/id[your-app-id]?action=write-review");
    };

    const handleInfoPress = () => {
        navigation.navigate("AppInfo");
    };

    const goToWelcomeScreen = async () => {
        try {
            await AsyncStorage.setItem("alreadySetup", "false");

            // Reset the navigation to the Welcome screen
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Welcome" }],
                })
            );
        } catch (error) {
            console.error("Error resetting welcome screen:", error);
            Alert.alert("Error", "Failed to reset welcome screen.");
        }
    };

    const populateRandomWorkoutData = () => {
        const updatedHistory = { ...exerciseHistory };
        exercises.forEach((exercise) => {
            updatedHistory[exercise.id] = generateRandomWorkoutData(exercise);
        });
        setExerciseHistory(updatedHistory);
        Alert.alert("Success", "Random workout data has been generated for all exercises.");
    };

    const settingsOptions: SettingItem[] = [
        {
            id: "1",
            title: "One Rep Max Formula",
            action: () => navigation.navigate("OneRepMaxFormula"),
        },
        { id: "2", title: "Export Data", action: shareExportData },
        { id: "3", title: "Import Data", action: importData },
        { id: "4", title: "Rest Timer", action: () => navigation.navigate("RestTimer") },
        {
            id: "5",
            title: "Training Interval",
            action: () => navigation.navigate("TrainingInterval"),
        },
        {
            id: "6",
            title: "Default RPE",
            action: () => navigation.navigate("DefaultRpe"),
        },
        {
            id: "7",
            title: "Dark Mode",
            action: () => {}, // This will be handled by the Switch component
            isSwitch: true,
        },
        {
            id: "8",
            title: "Go to Setup Screen",
            action: goToWelcomeScreen,
        },
        {
            id: "9",
            title: "Delete All Data",
            action: handleDeleteAllData,
        },
        {
            id: "10",
            title: "Report Bug / Request Feature",
            action: handleEmailPress,
        },
        {
            id: "11",
            title: "Rate the App",
            action: handleAppStoreRating,
        },
        {
            id: "12",
            title: "How to Use the App",
            action: handleInfoPress,
        },
        {
            id: "13",
            title: "Generate Random Workout Data",
            action: populateRandomWorkoutData,
        },
    ];

    const renderItem = ({ item }: { item: SettingItem }) => (
        <TouchableOpacity style={[styles.settingItem]} onPress={item.action}>
            <Text style={[styles.settingTitle]}>{item.title}</Text>
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
