// screens/WelcomeScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createWelcomeStyles } from "../../styles/globalStyles";
import { suggestedPlans, Plan } from "../data/suggestedPlans";

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

    const handleNext = () => {
        if (selectedPlans.length === 0) {
            selectedPlans.push("no_program");
        }

        const plans: Plan[] = selectedPlans.map((planKey) => suggestedPlans[planKey]);
        navigation.navigate("PlanPreview", { plans });
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
        >
            <View style={styles.header}>
                <Text style={[styles.headerText, { color: currentTheme.colors.text }]}>
                    Workout App
                </Text>
            </View>
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                    Welcome to the Workout App!
                </Text>
                <Text style={[styles.subtitle, { color: currentTheme.colors.text }]}>
                    Choose your starting program(s):
                </Text>

                {Object.keys(suggestedPlans).map((planKey) => (
                    <TouchableOpacity
                        key={planKey}
                        style={[
                            styles.option,
                            selectedPlans.includes(planKey) && styles.selectedOption,
                            { borderColor: currentTheme.colors.border },
                        ]}
                        onPress={() => togglePlanSelection(planKey)}
                    >
                        <Text style={[styles.optionText, { color: currentTheme.colors.text }]}>
                            {suggestedPlans[planKey].name}
                        </Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
                    onPress={handleNext}
                >
                    <Text style={[styles.buttonText, { color: currentTheme.colors.background }]}>
                        Next
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default WelcomeScreen;
