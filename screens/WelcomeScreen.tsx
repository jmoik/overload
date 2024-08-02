// screens/WelcomeScreen.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createWelcomeStyles } from "../styles/globalStyles";
import { Exercise } from "../models/Exercise";

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Welcome">;

const WelcomeScreen = () => {
    const navigation = useNavigation<WelcomeScreenNavigationProp>();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createWelcomeStyles(currentTheme);
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);

    const togglePlanSelection = (plan: string) => {
        setSelectedPlans((prev) =>
            prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
        );
    };

    const handleGetStarted = async () => {
        if (selectedPlans.length === 0) {
            // If no plans are selected, treat it as "No Program"
            selectedPlans.push("no_program");
        }
        const plans: { name: string; exercises: Exercise[] }[] = selectedPlans
            .map((plan) => {
                switch (plan) {
                    case "powerlifting":
                        return {
                            name: "Powerlifting",
                            exercises: [
                                {
                                    id: Date.now().toString(),
                                    name: "Squat",
                                    description: "Barbell back squat",
                                    weeklySets: 12,
                                    targetRPE: 8,
                                    category: "Legs",
                                },
                                {
                                    id: (Date.now() + 1).toString(),
                                    name: "Bench Press",
                                    description: "Barbell bench press",
                                    weeklySets: 12,
                                    targetRPE: 8,
                                    category: "Chest",
                                },
                                {
                                    id: (Date.now() + 2).toString(),
                                    name: "Deadlift",
                                    description: "Conventional deadlift",
                                    weeklySets: 8,
                                    targetRPE: 8,
                                    category: "Back",
                                },
                            ],
                        };
                    case "atg_mobility":
                        return {
                            name: "ATG Mobility",
                            exercises: [
                                {
                                    id: Date.now().toString(),
                                    name: "ATG Split Squat",
                                    description: "Advanced split squat variation",
                                    weeklySets: 12,
                                    targetRPE: 7,
                                    category: "Legs",
                                },
                                {
                                    id: (Date.now() + 1).toString(),
                                    name: "Seated Good Morning",
                                    description: "Seated variation of good morning exercise",
                                    weeklySets: 10,
                                    targetRPE: 7,
                                    category: "Back",
                                },
                                {
                                    id: (Date.now() + 2).toString(),
                                    name: "Back Extension",
                                    description: "Lower back strengthening exercise",
                                    weeklySets: 10,
                                    targetRPE: 7,
                                    category: "Back",
                                },
                                {
                                    id: (Date.now() + 3).toString(),
                                    name: "Calf Raise",
                                    description: "Standing calf raise",
                                    weeklySets: 15,
                                    targetRPE: 8,
                                    category: "Legs",
                                },
                                {
                                    id: (Date.now() + 4).toString(),
                                    name: "Seated Calf Raise",
                                    description: "Seated variation of calf raise",
                                    weeklySets: 15,
                                    targetRPE: 8,
                                    category: "Legs",
                                },
                                {
                                    id: (Date.now() + 5).toString(),
                                    name: "Tibialis Raise",
                                    description: "Exercise for tibialis anterior muscle",
                                    weeklySets: 12,
                                    targetRPE: 7,
                                    category: "Legs",
                                },
                                {
                                    id: (Date.now() + 6).toString(),
                                    name: "Couch Stretch",
                                    description: "Hip flexor and quad stretch",
                                    weeklySets: 7,
                                    targetRPE: 6,
                                    category: "Mobility",
                                },
                                {
                                    id: (Date.now() + 7).toString(),
                                    name: "Pigeon Stretch",
                                    description: "Hip opener stretch",
                                    weeklySets: 7,
                                    targetRPE: 6,
                                    category: "Mobility",
                                },
                                {
                                    id: (Date.now() + 8).toString(),
                                    name: "Pancake Stretch",
                                    description: "Forward fold with legs wide",
                                    weeklySets: 7,
                                    targetRPE: 6,
                                    category: "Mobility",
                                },
                            ],
                        };
                    case "no_program":
                        return {
                            name: "No Program",
                            exercises: [],
                        };
                    default:
                        return {
                            name: "No Program",
                            exercises: [],
                        };
                }
            })
            .filter(Boolean);

        if (selectedPlans.length === 1 && selectedPlans[0] === "no_program") {
            // If only "No Program" is selected, skip the preview screen
            await AsyncStorage.setItem("alreadySetup", "true");
            navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
            });
        } else {
            // Otherwise, navigate to the PlanPreview screen
            navigation.navigate("PlanPreview", { plans });
        }
    };
    return (
        <ScrollView
            style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                Welcome to the Workout App!
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.colors.text }]}>
                Choose your starting program(s):
            </Text>

            {["powerlifting", "atg_mobility", "no_program"].map((plan) => (
                <TouchableOpacity
                    key={plan}
                    style={[
                        styles.option,
                        selectedPlans.includes(plan) && styles.selectedOption,
                        { borderColor: currentTheme.colors.border },
                    ]}
                    onPress={() => togglePlanSelection(plan)}
                >
                    <Text style={[styles.optionText, { color: currentTheme.colors.text }]}>
                        {plan === "powerlifting"
                            ? "Powerlifting"
                            : plan === "atg_mobility"
                            ? "ATG Mobility"
                            : "No Program"}
                    </Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handleGetStarted}
            >
                <Text style={[styles.buttonText, { color: currentTheme.colors.background }]}>
                    Get Started
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default WelcomeScreen;
