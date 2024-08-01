// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import RoutineScreen from "./screens/RoutineScreen";
import AddExerciseScreen from "./screens/AddExerciseScreen";
import ExerciseHistoryScreen from "./screens/ExerciseHistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { ExerciseProvider } from "./contexts/ExerciseContext";
import { RootStackParamList } from "./types/navigation";
import OneRepMaxFormulaScreen from "./screens/OneRepMaxFormulaScreen";
import RestTimerScreen from "./screens/RestTimerScreen";
import { shareExportData } from "./utils/exportData";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
    <Tab.Navigator>
        <Tab.Screen
            name="RoutineTab"
            component={RoutineScreen}
            options={{
                title: "My Routine",
                tabBarIcon: ({ color, size }) => <Icon name="list" color={color} size={size} />,
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

const App = () => {
    return (
        <ExerciseProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="MainTabs"
                        component={MainTabs}
                        options={{ headerShown: false }}
                    />
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
                </Stack.Navigator>
            </NavigationContainer>
        </ExerciseProvider>
    );
};

export default App;
