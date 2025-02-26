// screens/settings/DailyStepGoalScreen.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme } from "../../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types/navigation";
import { lightTheme, darkTheme, createTrainingIntervalStyles } from "../../../styles/globalStyles";

type DailyStepGoalScreenNavigationProp = StackNavigationProp<RootStackParamList, "DailyStepGoal">;

const DailyStepGoalScreen = () => {
    const navigation = useNavigation<DailyStepGoalScreenNavigationProp>();
    const [stepGoal, setStepGoal] = useState("10000");
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createSimplifiedStyles(currentTheme);

    // Generate step goal options from 1,000 to 30,000 in increments of 500
    const stepGoalOptions = Array.from({ length: 59 }, (_, i) => ((i + 2) * 500).toString());

    // No quick options anymore

    useEffect(() => {
        // Load saved step goal
        const loadStepGoal = async () => {
            try {
                const savedStepGoal = await AsyncStorage.getItem("dailyStepGoal");
                if (savedStepGoal) {
                    setStepGoal(savedStepGoal);
                }
            } catch (error) {
                console.error("Error loading step goal:", error);
            }
        };

        loadStepGoal();
    }, []);

    const handleSave = async () => {
        const numStepGoal = parseInt(stepGoal, 10);

        if (isNaN(numStepGoal) || numStepGoal <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid number greater than 0");
            return;
        }

        try {
            await AsyncStorage.setItem("dailyStepGoal", stepGoal);
            navigation.goBack();
        } catch (error) {
            console.error("Error saving step goal:", error);
            Alert.alert("Error", "Failed to save step goal");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Daily Step Goal</Text>

            {/* iOS Picker Wheel */}
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={stepGoal}
                    onValueChange={(itemValue) => setStepGoal(itemValue.toString())}
                    itemStyle={styles.pickerItem}
                    style={styles.picker}
                >
                    {stepGoalOptions.map((value) => (
                        <Picker.Item
                            key={value}
                            label={`${parseInt(value).toLocaleString()} steps`}
                            value={value}
                        />
                    ))}
                </Picker>
            </View>

            {/* Quick options removed */}

            {/* Custom Input */}
            <TextInput
                style={styles.input}
                value={stepGoal}
                onChangeText={setStepGoal}
                keyboardType="numeric"
                placeholder="Custom goal"
                placeholderTextColor={currentTheme.colors.placeholder}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const createSimplifiedStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center", // Center content vertically
        },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            color: theme.colors.text,
            marginBottom: 30,
        },
        pickerContainer: {
            width: "80%",
            marginBottom: 30,
        },
        picker: {
            width: "100%",
        },
        pickerItem: {
            fontSize: 22,
            color: theme.colors.text,
            height: 150,
        },
        // Quick options styles removed
        input: {
            height: 50,
            width: "60%",
            borderWidth: 1,
            borderColor: theme.colors.border || "#ccc",
            borderRadius: 8,
            paddingHorizontal: 15,
            fontSize: 18,
            marginBottom: 20,
            textAlign: "center",
            color: theme.colors.text,
        },
        saveButton: {
            backgroundColor: theme.colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 30,
            width: "70%",
        },
        saveButtonText: {
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
        },
    });

export default DailyStepGoalScreen;
