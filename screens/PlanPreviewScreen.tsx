// screens/PlanPreviewScreen.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch } from "react-native";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../styles/globalStyles";
import { Exercise } from "../contexts/Exercise";

type PlanPreviewScreenRouteProp = RouteProp<RootStackParamList, "PlanPreview">;
type PlanPreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, "PlanPreview">;

type Props = {
    route: PlanPreviewScreenRouteProp;
    navigation: PlanPreviewScreenNavigationProp;
};

type PlanItem = {
    name: string;
    exercises: (Exercise & { isSelected: boolean })[];
};

type GroupedExercises = {
    [key: string]: (Exercise & { isSelected: boolean })[];
};

const PlanPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
    const { plans: initialPlans } = route.params;
    const [plans, setPlans] = useState<PlanItem[]>(
        initialPlans.map((plan) => ({
            ...plan,
            exercises: plan.exercises.map((exercise) => ({ ...exercise, isSelected: __DEV__ })),
        }))
    );
    const { addExercise, exercises } = useExerciseContext();

    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;

    const groupedPlans = useMemo(() => {
        return plans.map((plan) => {
            const groupedExercises = plan.exercises.reduce((acc, exercise) => {
                if (!acc[exercise.muscleGroup]) {
                    acc[exercise.muscleGroup] = [];
                }
                acc[exercise.muscleGroup].push(exercise);
                return acc;
            }, {} as GroupedExercises);

            return {
                ...plan,
                groupedExercises,
            };
        });
    }, [plans]);

    const handleNext = () => {
        plans.forEach((plan) =>
            plan.exercises
                .filter((exercise) => exercise.isSelected)
                .forEach((exercise) => {
                    // Check if an exercise with the same ID already exists
                    const exerciseExists = exercises.some((e) => e.id === exercise.id);
                    if (!exerciseExists) {
                        addExercise(exercise);
                    }
                })
        );
        navigation.navigate("TrainingInterval");
    };

    const toggleExercise = (planIndex: number, exerciseId: string) => {
        const newPlans = [...plans];
        const exerciseIndex = newPlans[planIndex].exercises.findIndex((e) => e.id === exerciseId);
        newPlans[planIndex].exercises[exerciseIndex].isSelected =
            !newPlans[planIndex].exercises[exerciseIndex].isSelected;
        setPlans(newPlans);
    };

    const handleEditExercise = (
        exercise: Exercise & { isSelected: boolean },
        planIndex: number
    ) => {
        navigation.navigate("AddExercise", {
            exerciseData: exercise,
            onSave: (updatedExercise: Exercise) => {
                const newPlans = [...plans];
                const exerciseIndex = newPlans[planIndex].exercises.findIndex(
                    (e) => e.id === exercise.id
                );
                newPlans[planIndex].exercises[exerciseIndex] = {
                    ...updatedExercise,
                    isSelected: exercise.isSelected,
                };
                setPlans(newPlans);
            },
        });
    };

    const renderExerciseItem = (
        { item }: { item: Exercise & { isSelected: boolean } },
        planIndex: number
    ) => (
        <View style={[styles.exerciseItem, { borderColor: currentTheme.colors.border }]}>
            <TouchableOpacity
                style={styles.exerciseContent}
                onPress={() => handleEditExercise(item, planIndex)}
            >
                <Text style={[styles.exerciseName, { color: currentTheme.colors.text }]}>
                    {item.name}
                </Text>
                <Text style={[styles.exerciseDetails, { color: currentTheme.colors.text }]}>
                    {item.category === "endurance"
                        ? `${item.distance} km/week`
                        : `${item.weeklySets} sets/week`}
                </Text>
            </TouchableOpacity>
            <Switch
                value={item.isSelected}
                onValueChange={() => toggleExercise(planIndex, item.id)}
                trackColor={{ false: "#767577", true: currentTheme.colors.primary }}
                thumbColor={currentTheme.colors.background}
            />
        </View>
    );

    const renderMuscleGroupItem = (
        { item }: { item: [string, (Exercise & { isSelected: boolean })[]] },
        planIndex: number
    ) => (
        <View style={styles.muscleGroupContainer}>
            <Text style={[styles.muscleGroupTitle, { color: currentTheme.colors.text }]}>
                {item[0]}
            </Text>
            {item[1].map((exercise) => renderExerciseItem({ item: exercise }, planIndex))}
        </View>
    );

    const renderPlanItem = ({
        item,
        index,
    }: {
        item: PlanItem & { groupedExercises: GroupedExercises };
        index: number;
    }) => (
        <View style={styles.planContainer}>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>{item.name}</Text>
            <FlatList
                data={Object.entries(item.groupedExercises)}
                renderItem={({ item }) => renderMuscleGroupItem({ item }, index)}
                keyExtractor={(item) => item[0]}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <FlatList
                data={groupedPlans}
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    exerciseContent: {
        flex: 1,
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
    muscleGroupContainer: { marginBottom: 15 },
    muscleGroupTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
});

export default PlanPreviewScreen;
