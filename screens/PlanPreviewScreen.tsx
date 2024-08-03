// screens/PlanPreviewScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../styles/globalStyles";
import { Exercise } from "../models/Exercise";

type PlanPreviewScreenRouteProp = RouteProp<RootStackParamList, "PlanPreview">;
type PlanPreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, "PlanPreview">;

type Props = {
    route: PlanPreviewScreenRouteProp;
    navigation: PlanPreviewScreenNavigationProp;
};

type PlanItem = {
    name: string;
    exercises: Exercise[];
};

const PlanPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
    const { plans } = route.params;
    const { addExercise } = useExerciseContext();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;

    const handleNext = () => {
        plans.forEach((plan) => plan.exercises.forEach((exercise) => addExercise(exercise)));
        navigation.navigate("TrainingInterval");
    };

    const renderExerciseItem = ({ item }: { item: Exercise }) => (
        <View style={[styles.exerciseItem, { borderColor: currentTheme.colors.border }]}>
            <Text style={[styles.exerciseName, { color: currentTheme.colors.text }]}>
                {item.name}
            </Text>
            <Text style={[styles.exerciseDetails, { color: currentTheme.colors.text }]}>
                {item.weeklySets} sets/week | Target RPE: {item.targetRPE}
            </Text>
        </View>
    );

    const renderPlanItem = ({ item }: { item: PlanItem }) => (
        <View style={styles.planContainer}>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>{item.name}</Text>
            <FlatList
                data={item.exercises}
                renderItem={renderExerciseItem}
                keyExtractor={(exercise) => exercise.id}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <FlatList
                data={plans}
                renderItem={renderPlanItem}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                ListFooterComponent={
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
                        onPress={handleNext}
                    >
                        <Text
                            style={[styles.buttonText, { color: currentTheme.colors.background }]}
                        >
                            Next
                        </Text>
                    </TouchableOpacity>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    planContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    exerciseItem: {
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: "500",
    },
    exerciseDetails: {
        marginTop: 5,
    },
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default PlanPreviewScreen;
