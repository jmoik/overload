// App.tsx
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import AllExercisesScreen from "./src/screens/AllExercisesScreen";
import AddExerciseScreen from "./src/screens/AddExerciseScreen";
import ExerciseHistoryScreen from "./src/screens/ExerciseHistoryScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { ExerciseProvider } from "./src/contexts/ExerciseContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { RootStackParamList } from "./src/types/navigation";
import { navigationTheme } from "./styles/globalStyles";
import TrainingIntervalScreen from "./src/screens/settings/TrainingIntervalScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PlanPreviewScreen from "./src/screens/PlanPreviewScreen";
import StatsScreen from "./src/screens/StatsScreen";
import { RoutineProvider } from "./src/contexts/RoutineContext";
import RoutinesScreen from "./src/screens/RoutinesScreen";
import RoutineDetailScreen from "./src/screens/RoutineDetailScreen";
import AddRoutineScreen from "./src/screens/AddRoutineScreen";

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
        {/* <Tab.Screen
            name="Routines"
            component={RoutinesScreen}
            options={{
                title: "Routines",
                tabBarIcon: ({ color, size }) => (
                    <Icon name="list-circle" color={color} size={size} />
                ),
            }}
        /> */}
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
        {/* <Tab.Screen
            name="Today"
            component={SuggestedWorkoutScreen}
            options={{
                title: "Today",
                tabBarIcon: ({ color, size }) => <Icon name="today" color={color} size={size} />,
            }}
        /> */}
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
                    name="TrainingInterval"
                    component={TrainingIntervalScreen}
                    options={{ title: "Training Interval" }}
                />
                <Stack.Screen
                    name="PlanPreview"
                    component={PlanPreviewScreen}
                    options={{ title: "Plan Preview" }}
                />
                <Stack.Screen
                    name="RoutineDetail"
                    component={RoutineDetailScreen}
                    options={{ title: "Routine Details" }}
                />
                <Stack.Screen
                    name="AddRoutine"
                    component={AddRoutineScreen}
                    options={{
                        presentation: "modal",
                        title: "Add Routine",
                    }}
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
