// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import RoutineScreen from "./screens/RoutineScreen";
import AddExerciseScreen from "./screens/AddExerciseScreen";
import ExerciseHistoryScreen from "./screens/ExerciseHistoryScreen";
import { ExerciseProvider } from "./contexts/ExerciseContext";
import { RootStackParamList } from "./types/navigation";

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
    return (
        <ExerciseProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="Routine"
                        component={RoutineScreen}
                        options={{ title: "My Routine" }}
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
                </Stack.Navigator>
            </NavigationContainer>
        </ExerciseProvider>
    );
};

export default App;
