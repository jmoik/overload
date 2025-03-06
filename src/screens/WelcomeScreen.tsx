import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppleHealthKit from "react-native-health";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createWelcomeStyles } from "../../styles/globalStyles";
import { healthKitPermissions } from "../utils/healthKitPermissions";
import { useHealthKit } from "../contexts/HealthKitContext";
import { useExerciseContext } from "../contexts/ExerciseContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Welcome">;

const HealthKitIntroSteps = [
    {
        title: "Health Data Integration",
        description:
            "Overload Training uses Apple HealthKit to import your running workouts seamlessly into the app.",
        icon: "heart-pulse",
    },
    {
        title: "Data We Access",
        description: "We only access your running workout data to import your runs into the app.",
        icon: "run",
    },
    {
        title: "Your Privacy Matters",
        description:
            "Your health data stays on your device and is only used to display your running history.",
        icon: "shield-check",
    },
];

const WelcomeScreen = () => {
    const navigation = useNavigation<WelcomeScreenNavigationProp>();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createWelcomeStyles(currentTheme);
    const { exercises } = useExerciseContext();
    const [showHealthKitIntro, setShowHealthKitIntro] = useState(true);
    const [currentIntroStep, setCurrentIntroStep] = useState(0);
    const { setIsHealthKitAuthorized } = useHealthKit();
    const [isInitializing, setIsInitializing] = useState(false); // Prevent multiple calls

    const navigateBasedOnExercises = useCallback(() => {
        if (exercises && exercises.length > 0) {
            navigation.navigate("Home");
        } else {
            navigation.navigate("OnboardingWizard");
        }
    }, [exercises, navigation]);

    const initializeHealthKit = useCallback(async () => {
        if (isInitializing) {
            console.log("HealthKit initialization already in progress, skipping...");
            return;
        }

        setIsInitializing(true);
        console.log("Initializing HealthKit...");

        if (Platform.OS !== "ios") {
            await AsyncStorage.setItem("alreadySetup", "true");
            navigateBasedOnExercises();
            setIsInitializing(false);
            return;
        }

        try {
            // Add a timeout to prevent hanging indefinitely
            const healthKitPromise = new Promise<void>((resolve, reject) => {
                AppleHealthKit.initHealthKit(healthKitPermissions, (error: string) => {
                    if (error) {
                        console.log("[ERROR] Cannot initialize HealthKit:", error);
                        reject(new Error(error));
                    } else {
                        console.log("HealthKit initialized successfully");
                        resolve();
                    }
                });
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("HealthKit initialization timed out")), 10000)
            );

            await Promise.race([healthKitPromise, timeoutPromise]);

            setIsHealthKitAuthorized(true);
            await AsyncStorage.setItem("alreadySetup", "true");
            navigateBasedOnExercises();
        } catch (error) {
            console.error("HealthKit initialization failed or timed out:", error);
            Alert.alert(
                "HealthKit Issue",
                "Unable to initialize HealthKit. You can still proceed, but workout data won’t be imported.",
                [
                    {
                        text: "Continue",
                        onPress: async () => {
                            await AsyncStorage.setItem("alreadySetup", "true");
                            navigateBasedOnExercises();
                        },
                    },
                ]
            );
        } finally {
            setIsInitializing(false);
        }
    }, [isInitializing, navigateBasedOnExercises, setIsHealthKitAuthorized]);

    const renderHealthKitIntro = () => {
        const step = HealthKitIntroSteps[currentIntroStep];

        return (
            <View style={styles.introContainer}>
                <Icon
                    name={step.icon}
                    size={80}
                    color={currentTheme.colors.primary}
                    style={styles.introIcon}
                />
                <Text style={[styles.introTitle, { color: currentTheme.colors.text }]}>
                    {step.title}
                </Text>
                <Text style={[styles.introDescription, { color: currentTheme.colors.text }]}>
                    {step.description}
                </Text>

                <View style={styles.introDots}>
                    {HealthKitIntroSteps.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor:
                                        currentIntroStep === index
                                            ? currentTheme.colors.primary
                                            : currentTheme.colors.border,
                                },
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
                    onPress={() => {
                        if (currentIntroStep === HealthKitIntroSteps.length - 1) {
                            initializeHealthKit();
                        } else {
                            setCurrentIntroStep((prev) => prev + 1);
                        }
                    }}
                    disabled={isInitializing} // Disable button during initialization
                >
                    <Text style={[styles.buttonText, { color: currentTheme.colors.background }]}>
                        {isInitializing ? "Initializing..." : "Continue"}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
        >
            {showHealthKitIntro && renderHealthKitIntro()}
        </SafeAreaView>
    );
};

export default WelcomeScreen;
