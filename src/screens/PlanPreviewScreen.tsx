import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch } from "react-native";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../styles/globalStyles";
import { Exercise } from "../contexts/Exercise";
import {
    recalculateWeeklySets,
    weeklyVolumePerMuscleGroupPerCategory,
} from "../data/suggestedPlans";

type PlanItem = {
    name: string;
    category: string;
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
                            opacity: p === 0 ? 0.15 : p / 3,
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

const PlanPreviewScreen: React.FC<{
    route: RouteProp<RootStackParamList, "PlanPreview">;
    navigation: StackNavigationProp<RootStackParamList, "PlanPreview">;
}> = ({ route, navigation }) => {
    const { category } = route.params;
    const { addExercise, exercises, updateExercise } = useExerciseContext();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const [showIntroPopup, setShowIntroPopup] = useState(exercises.length === 0);

    const [plans, setPlans] = useState<PlanItem[]>(() => {
        if (exercises.length !== 0) {
            const filteredExercises = exercises.filter((exercise) => {
                if (category === "all") return true;
                return exercise.category === category;
            });

            const exercisesByMuscle = filteredExercises.reduce((acc, exercise) => {
                if (!acc[exercise.muscleGroup]) {
                    acc[exercise.muscleGroup] = [];
                }
                acc[exercise.muscleGroup].push(exercise);
                return acc;
            }, {} as Record<string, Exercise[]>);

            const combinedPlan = {
                name: category.charAt(0).toUpperCase() + category.slice(1),
                category: category,
                exercises: Object.entries(exercisesByMuscle).flatMap(([muscleGroup, exercises]) =>
                    exercises.map((exercise) => ({
                        ...exercise,
                        isSelected: true,
                        priority: exercise.priority !== undefined ? exercise.priority : 1,
                    }))
                ),
            };
            return [combinedPlan];
        } else {
            const { suggestedPlans } = require("../data/suggestedPlans");
            const plansArray = Object.entries(suggestedPlans).map(([key, plan]) => ({
                name: plan.name,
                category: key,
                exercises: plan.exercises.map((exercise) => ({
                    ...exercise,
                    isSelected: true,
                    priority: exercise.priority !== undefined ? exercise.priority : 1,
                })),
            }));
            return plansArray;
        }
    });

    // Initial calculation of weekly sets on mount
    useEffect(() => {
        const newPlans = plans.map((plan) => {
            const exercisesByMuscleGroup = plan.exercises.reduce((acc, exercise) => {
                if (!acc[exercise.muscleGroup]) {
                    acc[exercise.muscleGroup] = [];
                }
                acc[exercise.muscleGroup].push(exercise);
                return acc;
            }, {} as Record<string, (Exercise & { isSelected: boolean })[]>);

            let updatedExercises = [...plan.exercises];
            Object.entries(exercisesByMuscleGroup).forEach(([muscleGroup, groupExercises]) => {
                const recalculated = recalculateWeeklySets(
                    groupExercises,
                    muscleGroup,
                    plan.category
                );
                recalculated.forEach((recalcEx) => {
                    const idx = updatedExercises.findIndex((e) => e.id === recalcEx.id);
                    if (idx !== -1) {
                        updatedExercises[idx] = recalcEx;
                    }
                });
            });

            return { ...plan, exercises: updatedExercises };
        });
        setPlans(newPlans);
    }, []); // Empty dependency array ensures this runs only on mount

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
                const updatedExercises = recalculateWeeklySets(
                    groupExercises,
                    muscleGroup,
                    plan.category
                );

                updatedExercises
                    .filter((exercise) => exercise.isSelected)
                    .forEach((exercise) => {
                        const exerciseExists = exercises.some((e) => e.id === exercise.id);
                        if (exerciseExists) {
                            const { id, isSelected, ...exerciseData } = exercise;
                            updateExercise(id, exerciseData);
                        } else {
                            const { isSelected, ...newExercise } = exercise;
                            addExercise(newExercise);
                        }
                    });
            });
        });
        navigation.navigate("Home");
    };

    // Remove the second useEffect that redundantly updates plans based on exercises
    // This was causing inconsistent state updates

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

        const muscleGroupExercises = plan.exercises.filter(
            (ex) => ex.muscleGroup === exercise.muscleGroup
        );
        const updatedExercises = recalculateWeeklySets(
            muscleGroupExercises,
            exercise.muscleGroup,
            plan.category
        );

        updatedExercises.forEach((updatedEx) => {
            const idx = plan.exercises.findIndex((e) => e.id === updatedEx.id);
            if (idx !== -1) {
                plan.exercises[idx] = updatedEx;
            }
        });

        setPlans(newPlans);
    };

    const handleVolumeChange = (
        newVolume: number,
        muscleGroup: string,
        category: string,
        planIndex: number
    ) => {
        // Update the global volume reference
        if (!weeklyVolumePerMuscleGroupPerCategory[category]) {
            weeklyVolumePerMuscleGroupPerCategory[category] = {};
        }
        weeklyVolumePerMuscleGroupPerCategory[category][muscleGroup] = newVolume;

        const newPlans = [...plans];
        const plan = newPlans[planIndex];

        // Get all exercises for this muscle group and category
        const muscleGroupExercises = plan.exercises.filter(
            (ex) => ex.muscleGroup === muscleGroup && ex.category === category
        );

        // Get only selected exercises
        const selectedExercises = muscleGroupExercises.filter((ex) => ex.isSelected);

        if (selectedExercises.length > 0) {
            // Calculate total priority of selected exercises
            const totalPriority = selectedExercises.reduce(
                (sum, ex) => sum + (ex.priority > 0 ? ex.priority : 0),
                0
            );

            if (totalPriority > 0) {
                // Distribute the new volume according to priorities
                selectedExercises.forEach((ex) => {
                    const idx = plan.exercises.findIndex((e) => e.id === ex.id);
                    if (idx !== -1 && ex.priority > 0) {
                        // Calculate new weekly sets based on priority ratio
                        const newSets = Math.max(
                            1,
                            Math.floor((ex.priority / totalPriority) * newVolume)
                        );
                        plan.exercises[idx] = {
                            ...plan.exercises[idx],
                            weeklySets: newSets,
                        };
                    }
                });

                // Distribute any remaining sets
                const distributableSets = selectedExercises.reduce((sum, ex) => {
                    const newSets = Math.floor((ex.priority / totalPriority) * newVolume);
                    return sum + newSets;
                }, 0);

                const remainingSets = newVolume - distributableSets;

                if (remainingSets > 0) {
                    // Sort by fraction to distribute remaining sets
                    const sortedByFraction = selectedExercises
                        .filter((ex) => ex.priority > 0)
                        .map((ex) => ({
                            id: ex.id,
                            fraction:
                                (ex.priority / totalPriority) * newVolume -
                                Math.floor((ex.priority / totalPriority) * newVolume),
                        }))
                        .sort((a, b) => b.fraction - a.fraction)
                        .slice(0, remainingSets);

                    sortedByFraction.forEach(({ id }) => {
                        const idx = plan.exercises.findIndex((e) => e.id === id);
                        if (idx !== -1) {
                            plan.exercises[idx].weeklySets++;
                        }
                    });
                }
            } else {
                // If no priorities, distribute evenly
                const setsPerExercise = Math.floor(newVolume / selectedExercises.length);
                const remainder = newVolume % selectedExercises.length;

                selectedExercises.forEach((ex, i) => {
                    const idx = plan.exercises.findIndex((e) => e.id === ex.id);
                    if (idx !== -1) {
                        plan.exercises[idx] = {
                            ...plan.exercises[idx],
                            weeklySets: setsPerExercise + (i < remainder ? 1 : 0),
                        };
                    }
                });
            }
        }

        setPlans(newPlans);
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

    // First, update the renderExerciseItem function to conditionally show the PrioritySelector
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
                    {`${item.weeklySets} sets/week`}
                </Text>
            </TouchableOpacity>

            {/* Only show priority selector if the exercise is selected */}
            {item.isSelected && (
                <PrioritySelector
                    priority={item.priority}
                    onPriorityChange={(p) => handlePriorityChange(p, item, planIndex)}
                    theme={currentTheme}
                />
            )}

            {/* Show toggle only for suggested plans (when exercises array is empty) */}
            {exercises.length === 0 && (
                <Switch
                    value={item.isSelected}
                    onValueChange={(value) => handleToggleExercise(item, value, planIndex)}
                    trackColor={{
                        false: currentTheme.colors.border,
                        true: currentTheme.colors.primary,
                    }}
                />
            )}
        </View>
    );

    // Update the handleToggleExercise function to set priority to 0 when deselected
    const handleToggleExercise = (
        exercise: Exercise & { isSelected: boolean },
        isSelected: boolean,
        planIndex: number
    ) => {
        const newPlans = [...plans];
        const plan = newPlans[planIndex];
        const exerciseIndex = plan.exercises.findIndex((e) => e.id === exercise.id);

        if (exerciseIndex !== -1) {
            plan.exercises[exerciseIndex] = {
                ...plan.exercises[exerciseIndex],
                isSelected: isSelected,
                // When deselecting, automatically set priority to 0
                priority: isSelected ? plan.exercises[exerciseIndex].priority : 0,
            };

            const muscleGroupExercises = plan.exercises.filter(
                (ex) => ex.muscleGroup === exercise.muscleGroup
            );
            const updatedExercises = recalculateWeeklySets(
                muscleGroupExercises,
                exercise.muscleGroup,
                plan.category
            );

            updatedExercises.forEach((updatedEx) => {
                const idx = plan.exercises.findIndex((e) => e.id === updatedEx.id);
                if (idx !== -1) {
                    plan.exercises[idx] = updatedEx;
                }
            });

            setPlans(newPlans);
        }
    };

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
        const category = exercises[0]?.category || "strength";

        // Calculate actual total volume from exercises
        const actualTotalVolume = exercises.reduce((sum, ex) => sum + (ex.weeklySets || 0), 0);

        // Use actual volume if available, otherwise fallback to default
        const totalVolume =
            actualTotalVolume > 0
                ? actualTotalVolume
                : weeklyVolumePerMuscleGroupPerCategory[category]?.[muscleGroup] || 12;

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

    // Updated handleAddNewExercise in PlanPreviewScreen to pass muscle group and category
    const handleAddNewExercise = (muscleGroup: string, planIndex: number) => {
        navigation.navigate("AddExercise", {
            muscleGroup,
            category: plans[planIndex].category,
            onSave: (newExercise) => {
                const newPlans = [...plans];
                const plan = newPlans[planIndex];
                const newExerciseWithSelection = { ...newExercise, isSelected: true };
                plan.exercises.push(newExerciseWithSelection);

                const muscleGroupExercises = plan.exercises.filter(
                    (ex) => ex.muscleGroup === muscleGroup
                );
                const updatedExercises = recalculateWeeklySets(
                    muscleGroupExercises,
                    muscleGroup,
                    plan.category
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

    // Updated handleEditExercise in PlanPreviewScreen to pass exerciseData
    const handleEditExercise = (
        exercise: Exercise & { isSelected: boolean },
        planIndex: number
    ) => {
        // Remove isSelected property since AddExerciseScreen doesn't expect it
        const { isSelected, ...exerciseData } = exercise;

        navigation.navigate("AddExercise", {
            exerciseData,
            muscleGroup: exercise.muscleGroup,
            category: exercise.category,
            planIndex,
            onSave: (updatedExercise) => {
                const newPlans = [...plans];
                const plan = newPlans[planIndex];
                const exerciseIndex = plan.exercises.findIndex((e) => e.id === exercise.id);

                plan.exercises[exerciseIndex] = {
                    ...updatedExercise,
                    isSelected: plan.exercises[exerciseIndex].isSelected,
                };

                const muscleGroupExercises = plan.exercises.filter(
                    (ex) => ex.muscleGroup === updatedExercise.muscleGroup
                );
                const updatedExercises = recalculateWeeklySets(
                    muscleGroupExercises,
                    updatedExercise.muscleGroup,
                    plan.category
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
                        handleVolumeChange(
                            newVolume,
                            muscleGroup,
                            plans[planIndex].category,
                            planIndex
                        )
                    }
                    theme={currentTheme}
                />
                {exercises.map((exercise) => renderExerciseItem({ item: exercise }, planIndex))}
                <TouchableOpacity
                    style={[
                        styles.exerciseItem,
                        styles.addExerciseButton,
                        { borderColor: currentTheme.colors.border },
                    ]}
                    onPress={() => handleAddNewExercise(muscleGroup, planIndex)}
                >
                    <Text style={[styles.exerciseName, { color: currentTheme.colors.text }]}>
                        Add Exercise
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderPlanItem = ({
        item,
        index,
    }: {
        item: PlanItem & { groupedExercises: GroupedExercises };
        index: number;
    }) => {
        // Sort the muscle groups alphabetically by their names
        const sortedMuscleGroups = Object.entries(item.groupedExercises).sort(([a], [b]) =>
            a.localeCompare(b)
        );

        return (
            <View style={styles.planContainer}>
                <Text style={[styles.title, { color: currentTheme.colors.text }]}>{item.name}</Text>
                <FlatList
                    data={sortedMuscleGroups}
                    renderItem={({ item }) => renderMuscleGroupItem({ item }, index)}
                    keyExtractor={(item) => item[0]}
                />
            </View>
        );
    };

    const IntroPopup = () => (
        <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowIntroPopup(false)}
        >
            <View
                style={[styles.popupContainer, { backgroundColor: currentTheme.colors.background }]}
            >
                <Text style={[styles.popupTitle, { color: currentTheme.colors.text }]}>
                    Welcome to Your Workout Plan
                </Text>
                <Text style={[styles.popupText, { color: currentTheme.colors.text }]}>
                    Here's how to customize your workout:
                </Text>
                <View style={styles.instructionContainer}>
                    <Text style={[styles.instructionPoint, { color: currentTheme.colors.text }]}>
                        • Toggle switches to select/deselect exercises
                    </Text>
                    <Text style={[styles.instructionPoint, { color: currentTheme.colors.text }]}>
                        • Set priority (0-3) for each exercise (0 = skip, 3 = highest priority)
                    </Text>
                    <Text style={[styles.instructionPoint, { color: currentTheme.colors.text }]}>
                        • Adjust total weekly volume using +/- buttons
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: currentTheme.colors.primary }]}
                    onPress={() => setShowIntroPopup(false)}
                >
                    <Text
                        style={[styles.closeButtonText, { color: currentTheme.colors.background }]}
                    >
                        Got it
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    // Modify the return statement to include the popup when needed
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

            {/* Show intro popup only for suggested plans */}
            {showIntroPopup && <IntroPopup />}
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
        marginRight: 12,
    },
    priorityButtons: {
        flexDirection: "row",
        gap: 6,
    },
    priorityButton: {
        width: 26,
        height: 26,
        borderRadius: 99,
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
    addExerciseButton: {
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    popupContainer: {
        width: "85%",
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    popupText: {
        fontSize: 16,
        marginBottom: 10,
    },
    instructionContainer: {
        marginVertical: 10,
    },
    instructionPoint: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    closeButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 15,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default PlanPreviewScreen;
