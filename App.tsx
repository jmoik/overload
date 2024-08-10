// App.tsx
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import AllExercisesScreen from "./screens/AllExercisesScreen";
import AddExerciseScreen from "./screens/AddExerciseScreen";
import ExerciseHistoryScreen from "./screens/ExerciseHistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { ExerciseProvider } from "./contexts/ExerciseContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { RootStackParamList } from "./types/navigation";
import { navigationTheme } from "./styles/globalStyles";
import OneRepMaxFormulaScreen from "./screens/settings/OneRepMaxFormulaScreen";
import RestTimerScreen from "./screens/settings/RestTimerScreen";
import TrainingIntervalScreen from "./screens/settings/TrainingIntervalScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PlanPreviewScreen from "./screens/PlanPreviewScreen";
import StatsScreen from "./screens/StatsScreen";
import DefaultRpeScreen from "./screens/settings/DefaultRpeScreen";
import InfoScreen from "./screens/settings/InfoScreen";
import SuggestedWorkoutScreen from "./screens/SuggestedWorkoutScreen";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const Home = () => (
    <Tab.Navigator>
        <Tab.Screen
            name="AllExercises"
            component={AllExercisesScreen}
            options={{
                title: "All Exercises",
                tabBarIcon: ({ color, size }) => <Icon name="list" color={color} size={size} />,
            }}
        />
        {
            <Tab.Screen
                name="SuggestedWorkout"
                component={SuggestedWorkoutScreen}
                options={{
                    title: "Suggested Workout",
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="barbell" color={color} size={size} />
                    ),
                }}
            />
        }
        <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
                title: "Training Statistics",
                tabBarIcon: ({ color, size }) => (
                    <Icon name="stats-chart" color={color} size={size} />
                ),
            }}
        />
        <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
                tabBarIcon: ({ color, size }) => (
                    <Icon name="settings-outline" color={color} size={size} />
                ),
            }}
        />
    </Tab.Navigator>
);

const AppContent = () => {
    const { theme } = useTheme();
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        checkIfFirstLaunch();
    }, []);

    const checkIfFirstLaunch = async () => {
        try {
            const alreadySetup = await AsyncStorage.getItem("alreadySetup");
            if (alreadySetup === null || alreadySetup === "false") {
                setIsFirstLaunch(true);
            } else {
                setIsFirstLaunch(false);
            }
        } catch (error) {
            console.error("Error checking if first launch:", error);
            setIsFirstLaunch(false);
        }
    };

    if (isFirstLaunch === null) {
        // Return a loading indicator or splash screen while checking
        return null;
    }

    return (
        <NavigationContainer theme={navigationTheme[theme]}>
            <Stack.Navigator initialRouteName={isFirstLaunch ? "Welcome" : "Home"}>
                <Stack.Screen
                    name="Welcome"
                    component={WelcomeScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />

                <Stack.Screen
                    name="AddExercise"
                    component={AddExerciseScreen}
                    options={{
                        presentation: "modal",
                        title: "Add Exercise",
                    }}
                />
                <Stack.Screen
                    name="ExerciseHistory"
                    component={ExerciseHistoryScreen}
                    options={{ title: "Exercise History" }}
                />
                <Stack.Screen
                    name="OneRepMaxFormula"
                    component={OneRepMaxFormulaScreen}
                    options={{ title: "One Rep Max Formula" }}
                />
                <Stack.Screen
                    name="RestTimer"
                    component={RestTimerScreen}
                    options={{ title: "Rest Timer" }}
                />
                <Stack.Screen
                    name="TrainingInterval"
                    component={TrainingIntervalScreen}
                    options={{ title: "Training Interval" }}
                />
                <Stack.Screen
                    name="DefaultRpe"
                    component={DefaultRpeScreen}
                    options={{ title: "Default RPE" }}
                />
                <Stack.Screen
                    name="AppInfo"
                    component={InfoScreen}
                    options={{ title: "How to Use the App" }}
                />
                <Stack.Screen
                    name="PlanPreview"
                    component={PlanPreviewScreen}
                    options={{ title: "Plan Preview" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <ExerciseProvider>
                <AppContent />
            </ExerciseProvider>
        </ThemeProvider>
    );
};

export default App;
