import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch } from "react-native";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../styles/globalStyles";
import { Exercise } from "../contexts/Exercise";
import { weeklyVolumePerMuscleGroup } from "../data/suggestedPlans";

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

const PrioritySelector = ({
    priority,
    onPriorityChange,
    theme,
}: {
    priority: number;
    onPriorityChange: (p: number) => void;
    theme: typeof lightTheme;
}) => (
    <View style={styles.priorityContainer}>
        <View style={styles.priorityButtons}>
            {[0, 1, 2, 3].map((p) => (
                <TouchableOpacity
                    key={p}
                    style={[
                        styles.priorityButton,
                        {
                            backgroundColor:
                                priority === p ? theme.colors.primary : theme.colors.border,
                            opacity: p === 0 ? 0.3 : 1,
                        },
                    ]}
                    onPress={() => onPriorityChange(p)}
                >
                    <Text
                        style={[
                            styles.priorityText,
                            { color: priority === p ? "white" : theme.colors.text },
                        ]}
                    >
                        {p}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const PlanPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
    const { plans: initialPlans } = route.params;
    const [plans, setPlans] = useState<PlanItem[]>(
        initialPlans.map((plan) => ({
            ...plan,
            exercises: plan.exercises.map((exercise) => ({
                ...exercise,
                isSelected: true,
                priority: exercise.priority,
            })),
        }))
    );
    const { addExercise, exercises, updateExercise } = useExerciseContext();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;

    const recalculateWeeklySets = (
        exercises: (Exercise & { isSelected: boolean })[],
        muscleGroup: string
    ) => {
        const activeExercises = exercises.filter(
            (e) => e.muscleGroup === muscleGroup && e.priority > 0
        );
        const totalPriority = activeExercises.reduce((sum, e) => sum + e.priority, 0);
        const totalVolume = weeklyVolumePerMuscleGroup[muscleGroup] || 12;

        return exercises.map((exercise) => ({
            ...exercise,
            weeklySets:
                exercise.priority > 0 && totalPriority > 0
                    ? Math.round((exercise.priority / totalPriority) * totalVolume)
                    : 0,
        }));
    };

    const handleNext = () => {
        plans.forEach((plan) => {
            const exercisesByMuscleGroup = plan.exercises.reduce((acc, exercise) => {
                if (!acc[exercise.muscleGroup]) {
                    acc[exercise.muscleGroup] = [];
                }
                acc[exercise.muscleGroup].push(exercise);
                return acc;
            }, {} as Record<string, (Exercise & { isSelected: boolean })[]>);

            Object.entries(exercisesByMuscleGroup).forEach(([muscleGroup, groupExercises]) => {
                const updatedExercises = recalculateWeeklySets(groupExercises, muscleGroup);

                updatedExercises
                    .filter((exercise) => exercise.isSelected)
                    .forEach((exercise) => {
                        const exerciseExists = exercises.some((e) => e.id === exercise.id);
                        if (exerciseExists) {
                            // Update existing exercise with new priority and weeklySets
                            const { id, isSelected, ...exerciseData } = exercise;
                            updateExercise(id, exerciseData);
                        } else {
                            // Add new exercise
                            const { isSelected, ...newExercise } = exercise;
                            addExercise(newExercise);
                        }
                    });
            });
        });
        navigation.navigate("Home");
    };

    const handlePriorityChange = (
        newPriority: number,
        exercise: Exercise & { isSelected: boolean },
        planIndex: number
    ) => {
        const newPlans = [...plans];
        const plan = newPlans[planIndex];
        const exerciseIndex = plan.exercises.findIndex((e) => e.id === exercise.id);

        plan.exercises[exerciseIndex] = {
            ...plan.exercises[exerciseIndex],
            priority: newPriority,
        };

        const updatedExercises = recalculateWeeklySets(plan.exercises, exercise.muscleGroup);
        updatedExercises.forEach((updatedEx) => {
            const idx = plan.exercises.findIndex((e) => e.id === updatedEx.id);
            if (idx !== -1) {
                plan.exercises[idx] = updatedEx;
            }
        });

        setPlans(newPlans);
    };

    const handleVolumeChange = (newVolume: number, muscleGroup: string, planIndex: number) => {
        weeklyVolumePerMuscleGroup[muscleGroup] = newVolume;

        const newPlans = [...plans];
        const plan = newPlans[planIndex];

        const updatedExercises = recalculateWeeklySets(plan.exercises, muscleGroup);
        updatedExercises.forEach((updatedEx) => {
            const idx = plan.exercises.findIndex((e) => e.id === updatedEx.id);
            if (idx !== -1) {
                plan.exercises[idx] = updatedEx;
            }
        });

        setPlans(newPlans);
    };

    const handleEditExercise = (
        exercise: Exercise & { isSelected: boolean },
        planIndex: number
    ) => {
        navigation.navigate("EditExercise", {
            exercise,
            planIndex,
            onSave: (updatedExercise) => {
                const newPlans = [...plans];
                const plan = newPlans[planIndex];
                const exerciseIndex = plan.exercises.findIndex((e) => e.id === exercise.id);

                plan.exercises[exerciseIndex] = {
                    ...updatedExercise,
                    isSelected: plan.exercises[exerciseIndex].isSelected,
                };

                const updatedExercises = recalculateWeeklySets(
                    plan.exercises,
                    updatedExercise.muscleGroup
                );
                updatedExercises.forEach((updatedEx) => {
                    const idx = plan.exercises.findIndex((e) => e.id === updatedEx.id);
                    if (idx !== -1) {
                        plan.exercises[idx] = updatedEx;
                    }
                });

                setPlans(newPlans);
            },
        });
    };

    const groupedPlans = useMemo(() => {
        return plans.map((plan) => ({
            ...plan,
            groupedExercises: plan.exercises.reduce((acc, exercise) => {
                if (!acc[exercise.muscleGroup]) {
                    acc[exercise.muscleGroup] = [];
                }
                acc[exercise.muscleGroup].push(exercise);
                return acc;
            }, {} as GroupedExercises),
        }));
    }, [plans]);

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
            <PrioritySelector
                priority={item.priority}
                onPriorityChange={(p) => handlePriorityChange(p, item, planIndex)}
                theme={currentTheme}
            />
        </View>
    );

    const MuscleGroupHeader = ({
        muscleGroup,
        exercises,
        onVolumeChange,
        theme,
    }: {
        muscleGroup: string;
        exercises: (Exercise & { isSelected: boolean })[];
        onVolumeChange: (newVolume: number) => void;
        theme: typeof lightTheme;
    }) => {
        const totalVolume = weeklyVolumePerMuscleGroup[muscleGroup] || 12;

        return (
            <View style={styles.muscleGroupHeader}>
                <Text style={[styles.muscleGroupTitle, { color: theme.colors.text }]}>
                    {muscleGroup}
                </Text>
                <View style={styles.volumeControls}>
                    <TouchableOpacity
                        onPress={() => onVolumeChange(Math.max(1, totalVolume - 1))}
                        style={[styles.volumeButton, { backgroundColor: theme.colors.border }]}
                    >
                        <Text style={[styles.volumeButtonText, { color: theme.colors.text }]}>
                            -
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.volumeText, { color: theme.colors.text }]}>
                        {totalVolume} sets/week
                    </Text>
                    <TouchableOpacity
                        onPress={() => onVolumeChange(totalVolume + 1)}
                        style={[styles.volumeButton, { backgroundColor: theme.colors.border }]}
                    >
                        <Text style={[styles.volumeButtonText, { color: theme.colors.text }]}>
                            +
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderMuscleGroupItem = (
        { item }: { item: [string, (Exercise & { isSelected: boolean })[]] },
        planIndex: number
    ) => {
        const [muscleGroup, exercises] = item;

        return (
            <View style={styles.muscleGroupContainer}>
                <MuscleGroupHeader
                    muscleGroup={muscleGroup}
                    exercises={exercises}
                    onVolumeChange={(newVolume) =>
                        handleVolumeChange(newVolume, muscleGroup, planIndex)
                    }
                    theme={currentTheme}
                />
                {exercises.map((exercise) => renderExerciseItem({ item: exercise }, planIndex))}
            </View>
        );
    };

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
                            Save Plan
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
    priorityContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    priorityButtons: {
        flexDirection: "row",
        gap: 4,
    },
    priorityButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    priorityText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    volumeEditor: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.05)",
        borderRadius: 8,
        padding: 4,
        gap: 8,
    },
    volumeDisplay: {
        padding: 4,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.05)",
    },
    muscleGroupHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    volumeControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    volumeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    volumeButtonText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    volumeText: {
        fontSize: 14,
        fontWeight: "500",
        minWidth: 80,
        textAlign: "center",
    },
});
export default PlanPreviewScreen;
