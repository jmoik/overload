import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Switch,
    SafeAreaView,
    ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../styles/globalStyles";
import { Exercise } from "../contexts/Exercise";
import {
    recalculateWeeklySets,
    weeklyVolumePerMuscleGroupPerCategory,
    suggestedPlans,
} from "../data/suggestedPlans";
import { Picker } from "@react-native-picker/picker";

// Define CategoryType type
type CategoryType = "strength" | "mobility" | "endurance";

enum WizardStep {
    // Introduction
    INTRO = 0,

    // Training Interval
    TRAINING_INTERVAL = 1,

    // Strength Category
    STRENGTH_OVERVIEW = 2,
    STRENGTH_SELECTION = 3,
    STRENGTH_ADJUSTMENT = 4, // Combined priority and volume step

    // Mobility Category
    MOBILITY_OVERVIEW = 5,
    MOBILITY_SELECTION = 6,
    MOBILITY_ADJUSTMENT = 7, // Combined priority and volume step

    // Endurance Category
    ENDURANCE_OVERVIEW = 8,
    ENDURANCE_SELECTION = 9,
    ENDURANCE_ADJUSTMENT = 10, // Combined priority and volume step

    // Final Review
    REVIEW = 11,
}

// Updated function to get the current step category
const getCurrentCategory = (step: WizardStep): CategoryType | null => {
    if (step === WizardStep.TRAINING_INTERVAL) {
        return null; // Training interval doesn't have a category
    } else if (step >= WizardStep.STRENGTH_OVERVIEW && step <= WizardStep.STRENGTH_ADJUSTMENT) {
        return "strength";
    } else if (step >= WizardStep.MOBILITY_OVERVIEW && step <= WizardStep.MOBILITY_ADJUSTMENT) {
        return "mobility";
    } else if (step >= WizardStep.ENDURANCE_OVERVIEW && step <= WizardStep.ENDURANCE_ADJUSTMENT) {
        return "endurance";
    }
    return null; // For INTRO and REVIEW steps
};

// Helper function to check if we're in a selection, priority, or volume step
const isSelectionStep = (step: WizardStep): boolean => {
    return (
        step === WizardStep.STRENGTH_SELECTION ||
        step === WizardStep.MOBILITY_SELECTION ||
        step === WizardStep.ENDURANCE_SELECTION
    );
};

const isAdjustmentStep = (step: WizardStep): boolean => {
    return (
        step === WizardStep.STRENGTH_ADJUSTMENT ||
        step === WizardStep.MOBILITY_ADJUSTMENT ||
        step === WizardStep.ENDURANCE_ADJUSTMENT
    );
};

const isOverviewStep = (step: WizardStep): boolean => {
    return (
        step === WizardStep.STRENGTH_OVERVIEW ||
        step === WizardStep.MOBILITY_OVERVIEW ||
        step === WizardStep.ENDURANCE_OVERVIEW
    );
};

// Initialize the component with more specific state management
const OnboardingWizard: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { addExercise, trainingInterval, setTrainingInterval } = useExerciseContext();
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;

    // Current step in the wizard
    const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.INTRO);

    // Currently selected muscle group index within the category
    const [currentMuscleGroupIndex, setCurrentMuscleGroupIndex] = useState(0);

    // Group muscle groups by category for easier management
    const [muscleGroupsByCategory, setMuscleGroupsByCategory] = useState<{
        [key in CategoryType]: string[];
    }>({
        strength: [],
        mobility: [],
        endurance: [],
    });

    // Add this useEffect to recalculate exercise sets when entering a volume step or changing muscle group
    useEffect(() => {
        // Only run this when in a volume step
        if (isAdjustmentStep(currentStep)) {
            // Make sure the category exists in the volume tracking object
            if (!weeklyVolumePerMuscleGroupPerCategory[currentCategory]) {
                weeklyVolumePerMuscleGroupPerCategory[currentCategory] = {};
            }

            // If volume isn't set for this muscle group yet, initialize with default value
            if (
                weeklyVolumePerMuscleGroupPerCategory[currentCategory][currentMuscleGroup] ===
                undefined
            ) {
                const defaultVolume = currentCategory === "endurance" ? 20 : 12;
                weeklyVolumePerMuscleGroupPerCategory[currentCategory][currentMuscleGroup] =
                    defaultVolume;
            }

            // Get the current volume for this muscle group
            const currentVolume =
                weeklyVolumePerMuscleGroupPerCategory[currentCategory][currentMuscleGroup];

            // Get all exercises for this muscle group and category
            const muscleGroupExercises = allExercises.filter(
                (ex) => ex.muscleGroup === currentMuscleGroup && ex.category === currentCategory
            );

            // Get selected exercises
            const selectedExercises = muscleGroupExercises.filter((ex) => ex.isSelected);

            if (selectedExercises.length > 0) {
                // Calculate total priority of selected exercises
                const totalPriority = selectedExercises.reduce(
                    (sum, ex) => sum + (ex.priority > 0 ? ex.priority : 0),
                    0
                );

                let updatedExercises = [...muscleGroupExercises];

                if (totalPriority > 0) {
                    // Distribute the volume according to priorities
                    selectedExercises.forEach((ex) => {
                        if (ex.priority > 0) {
                            const idx = updatedExercises.findIndex((e) => e.id === ex.id);
                            if (idx !== -1) {
                                // Calculate sets based on priority ratio
                                const newSets = Math.max(
                                    1,
                                    Math.floor((ex.priority / totalPriority) * currentVolume)
                                );
                                updatedExercises[idx] = {
                                    ...updatedExercises[idx],
                                    weeklySets: newSets,
                                };
                            }
                        }
                    });

                    // Distribute any remaining sets
                    const distributableSets = selectedExercises.reduce((sum, ex) => {
                        if (ex.priority > 0) {
                            const newSets = Math.floor(
                                (ex.priority / totalPriority) * currentVolume
                            );
                            return sum + newSets;
                        }
                        return sum;
                    }, 0);

                    const remainingSets = currentVolume - distributableSets;

                    if (remainingSets > 0) {
                        // Sort by fraction to distribute remaining sets
                        const sortedByFraction = selectedExercises
                            .filter((ex) => ex.priority > 0)
                            .map((ex) => ({
                                id: ex.id,
                                fraction:
                                    (ex.priority / totalPriority) * currentVolume -
                                    Math.floor((ex.priority / totalPriority) * currentVolume),
                            }))
                            .sort((a, b) => b.fraction - a.fraction)
                            .slice(0, remainingSets);

                        sortedByFraction.forEach(({ id }) => {
                            const idx = updatedExercises.findIndex((e) => e.id === id);
                            if (idx !== -1) {
                                updatedExercises[idx] = {
                                    ...updatedExercises[idx],
                                    weeklySets: updatedExercises[idx].weeklySets + 1,
                                };
                            }
                        });
                    }
                } else {
                    // If no priorities, distribute evenly
                    const setsPerExercise = Math.floor(currentVolume / selectedExercises.length);
                    const remainder = currentVolume % selectedExercises.length;

                    selectedExercises.forEach((ex, i) => {
                        const idx = updatedExercises.findIndex((e) => e.id === ex.id);
                        if (idx !== -1) {
                            updatedExercises[idx] = {
                                ...updatedExercises[idx],
                                weeklySets: setsPerExercise + (i < remainder ? 1 : 0),
                            };
                        }
                    });
                }

                // Update the state with properly calculated exercises
                setAllExercises((prevExercises) =>
                    prevExercises.map((ex) => {
                        const updated = updatedExercises.find((u) => u.id === ex.id);
                        return updated ? { ...updated, isSelected: ex.isSelected } : ex;
                    })
                );
            }
        }
    }, [currentStep, currentMuscleGroupIndex]); // Dependencies ensure this runs when step or muscle group changes

    // All exercises from suggested plans, with selection state
    const [allExercises, setAllExercises] = useState<(Exercise & { isSelected: boolean })[]>([]);

    // Add state to track which categories are enabled
    const [enabledCategories, setEnabledCategories] = useState<{
        [key in CategoryType]: boolean;
    }>({
        strength: true,
        mobility: true,
        endurance: true,
    });

    const renderTrainingIntervalScreen = () => {
        // Generate days options for the picker
        const generatePickerItems = () => {
            const items = [];
            for (let i = 1; i <= 30; i++) {
                items.push(
                    <Picker.Item
                        key={i}
                        label={`${i} day${i === 1 ? "" : "s"}`}
                        value={i}
                        color={currentTheme.colors.text}
                    />
                );
            }
            return items;
        };

        return (
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                    Select Your Training Interval
                </Text>

                <Text style={[styles.description, { color: currentTheme.colors.text }]}>
                    Your training interval defines over how many days the training volume is spread
                    out. The default is 7 days (weekly), but you can customize it to match your
                    preferred training cycle.
                </Text>

                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={trainingInterval}
                        onValueChange={(itemValue) => setTrainingInterval(itemValue)}
                        style={{ color: currentTheme.colors.text }}
                        dropdownIconColor={currentTheme.colors.text}
                    >
                        {generatePickerItems()}
                    </Picker>
                </View>

                <Text style={[styles.instruction, { color: currentTheme.colors.text }]}>
                    Your training volumes will be distributed across this {trainingInterval}-day
                    period. When calculating your remaining sets for each exercise, we'll take the
                    last {trainingInterval} days into account and recommend a specific workout based
                    on what is missing in the current interval.
                </Text>
            </View>
        );
    };

    // Initialize exercises from suggested plans
    useEffect(() => {
        const exercises: (Exercise & { isSelected: boolean })[] = [];

        // Gather all exercises
        Object.values(suggestedPlans).forEach((plan) => {
            plan.exercises.forEach((exercise) => {
                exercises.push({
                    ...exercise,
                    isSelected: true,
                });
            });
        });

        setAllExercises(exercises);

        // Initialize muscle groups for each category
        const categoryGroups: { [key in CategoryType]: string[] } = {
            strength: [],
            mobility: [],
            endurance: [],
        };

        // Group by category
        Object.values(suggestedPlans).forEach((plan) => {
            const category = plan.category as CategoryType;
            const muscleGroups = Array.from(
                new Set(plan.exercises.map((exercise) => exercise.muscleGroup))
            ).sort();

            categoryGroups[category] = muscleGroups;
        });

        setMuscleGroupsByCategory(categoryGroups);
    }, []);

    const currentCategory = getCurrentCategory(currentStep) || "strength";
    const currentMuscleGroups = muscleGroupsByCategory[currentCategory] || [];

    // Get the current muscle group name
    const currentMuscleGroup = currentMuscleGroups[currentMuscleGroupIndex] || "";

    // Get exercises for the current category and muscle group
    const currentExercises = allExercises.filter(
        (exercise) =>
            exercise.category === currentCategory && exercise.muscleGroup === currentMuscleGroup
    );

    // Toggle exercise selection
    const toggleExercise = (exercise: Exercise & { isSelected: boolean }) => {
        setAllExercises((prevExercises) =>
            prevExercises.map((ex) =>
                ex.id === exercise.id ? { ...ex, isSelected: !ex.isSelected } : ex
            )
        );
    };

    // Update exercise priority
    const updateExercisePriority = (
        exercise: Exercise & { isSelected: boolean },
        priority: number
    ) => {
        // First update the priority in the allExercises array
        setAllExercises((prevExercises) =>
            prevExercises.map((ex) => (ex.id === exercise.id ? { ...ex, priority } : ex))
        );

        // Get the current volume for this muscle group
        const currentVolume =
            weeklyVolumePerMuscleGroupPerCategory[currentCategory][currentMuscleGroup] ||
            (currentCategory === "endurance" ? 20 : 12);

        // Get all exercises for this muscle group and category
        const muscleGroupExercises = allExercises.filter(
            (ex) => ex.muscleGroup === currentMuscleGroup && ex.category === currentCategory
        );

        // Update the exercise with the new priority
        const updatedMuscleGroupExercises = muscleGroupExercises.map((ex) =>
            ex.id === exercise.id ? { ...ex, priority } : ex
        );

        // Get only selected exercises
        const selectedExercises = updatedMuscleGroupExercises.filter((ex) => ex.isSelected);

        if (selectedExercises.length > 0) {
            // Calculate total priority of selected exercises
            const totalPriority = selectedExercises.reduce(
                (sum, ex) => sum + (ex.priority > 0 ? ex.priority : 0),
                0
            );

            let updatedExercises = [...updatedMuscleGroupExercises];

            if (totalPriority > 0) {
                // Distribute the volume according to priorities
                selectedExercises.forEach((ex) => {
                    if (ex.priority > 0) {
                        const idx = updatedExercises.findIndex((e) => e.id === ex.id);
                        if (idx !== -1) {
                            // Calculate sets based on priority ratio
                            const newSets = Math.max(
                                1,
                                Math.floor((ex.priority / totalPriority) * currentVolume)
                            );
                            updatedExercises[idx] = {
                                ...updatedExercises[idx],
                                weeklySets: newSets,
                            };
                        }
                    }
                });

                // Distribute any remaining sets
                const distributableSets = selectedExercises.reduce((sum, ex) => {
                    if (ex.priority > 0) {
                        const newSets = Math.floor((ex.priority / totalPriority) * currentVolume);
                        return sum + newSets;
                    }
                    return sum;
                }, 0);

                const remainingSets = currentVolume - distributableSets;

                if (remainingSets > 0) {
                    // Sort by fraction to distribute remaining sets
                    const sortedByFraction = selectedExercises
                        .filter((ex) => ex.priority > 0)
                        .map((ex) => ({
                            id: ex.id,
                            fraction:
                                (ex.priority / totalPriority) * currentVolume -
                                Math.floor((ex.priority / totalPriority) * currentVolume),
                        }))
                        .sort((a, b) => b.fraction - a.fraction)
                        .slice(0, remainingSets);

                    sortedByFraction.forEach(({ id }) => {
                        const idx = updatedExercises.findIndex((e) => e.id === id);
                        if (idx !== -1) {
                            updatedExercises[idx] = {
                                ...updatedExercises[idx],
                                weeklySets: updatedExercises[idx].weeklySets + 1,
                            };
                        }
                    });
                }
            } else {
                // If no priorities, distribute evenly
                const setsPerExercise = Math.floor(currentVolume / selectedExercises.length);
                const remainder = currentVolume % selectedExercises.length;

                selectedExercises.forEach((ex, i) => {
                    const idx = updatedExercises.findIndex((e) => e.id === ex.id);
                    if (idx !== -1) {
                        updatedExercises[idx] = {
                            ...updatedExercises[idx],
                            weeklySets: setsPerExercise + (i < remainder ? 1 : 0),
                        };
                    }
                });
            }

            // Update the state with properly calculated exercises
            setAllExercises((prevExercises) =>
                prevExercises.map((ex) => {
                    const updated = updatedExercises.find((u) => u.id === ex.id);
                    return updated ? { ...updated } : ex;
                })
            );
        }
    };

    const updateVolume = (newVolume: number) => {
        // Ensure the category and muscle group entries exist
        if (!weeklyVolumePerMuscleGroupPerCategory[currentCategory]) {
            weeklyVolumePerMuscleGroupPerCategory[currentCategory] = {};
        }

        // Update the global volume reference
        weeklyVolumePerMuscleGroupPerCategory[currentCategory][currentMuscleGroup] = newVolume;

        // Get all exercises for this muscle group and category
        const muscleGroupExercises = allExercises.filter(
            (ex) => ex.muscleGroup === currentMuscleGroup && ex.category === currentCategory
        );

        // Get only selected exercises
        const selectedExercises = muscleGroupExercises.filter((ex) => ex.isSelected);

        if (selectedExercises.length > 0) {
            // Calculate total priority of selected exercises
            const totalPriority = selectedExercises.reduce(
                (sum, ex) => sum + (ex.priority > 0 ? ex.priority : 0),
                0
            );

            let updatedExercises = [...muscleGroupExercises];

            if (totalPriority > 0) {
                // Distribute the new volume according to priorities
                selectedExercises.forEach((ex) => {
                    if (ex.priority > 0) {
                        const idx = updatedExercises.findIndex((e) => e.id === ex.id);
                        if (idx !== -1) {
                            // Calculate new weekly sets based on priority ratio
                            const newSets = Math.max(
                                1,
                                Math.floor((ex.priority / totalPriority) * newVolume)
                            );
                            updatedExercises[idx] = {
                                ...updatedExercises[idx],
                                weeklySets: newSets,
                            };
                        }
                    }
                });

                // Distribute any remaining sets
                const distributableSets = selectedExercises.reduce((sum, ex) => {
                    if (ex.priority > 0) {
                        const newSets = Math.floor((ex.priority / totalPriority) * newVolume);
                        return sum + newSets;
                    }
                    return sum;
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
                        const idx = updatedExercises.findIndex((e) => e.id === id);
                        if (idx !== -1) {
                            updatedExercises[idx] = {
                                ...updatedExercises[idx],
                                weeklySets: updatedExercises[idx].weeklySets + 1,
                            };
                        }
                    });
                }
            } else {
                // If no priorities, distribute evenly
                const setsPerExercise = Math.floor(newVolume / selectedExercises.length);
                const remainder = newVolume % selectedExercises.length;

                selectedExercises.forEach((ex, i) => {
                    const idx = updatedExercises.findIndex((e) => e.id === ex.id);
                    if (idx !== -1) {
                        updatedExercises[idx] = {
                            ...updatedExercises[idx],
                            weeklySets: setsPerExercise + (i < remainder ? 1 : 0),
                        };
                    }
                });
            }

            // Update the state with recalculated exercises
            setAllExercises((prevExercises) =>
                prevExercises.map((ex) => {
                    const updated = updatedExercises.find((u) => u.id === ex.id);
                    return updated ? { ...updated, isSelected: ex.isSelected } : ex;
                })
            );
        } else {
            // Force a re-render even if no exercises are selected to update the UI
            setAllExercises((prevExercises) => [...prevExercises]);
        }
    };

    // Replace the existing renderVolumeControls function with this improved version
    const renderVolumeControls = () => {
        // Ensure the category and muscle group entries exist
        if (!weeklyVolumePerMuscleGroupPerCategory[currentCategory]) {
            weeklyVolumePerMuscleGroupPerCategory[currentCategory] = {};
        }

        // Use a default value if the volume isn't set yet
        const currentVolume =
            weeklyVolumePerMuscleGroupPerCategory[currentCategory]?.[currentMuscleGroup] || 12;

        const unit = currentCategory === "endurance" ? "km" : "sets";

        return (
            <View style={styles.volumeControls}>
                <TouchableOpacity
                    onPress={() => updateVolume(Math.max(1, currentVolume - 1))}
                    style={[styles.volumeButton, { backgroundColor: currentTheme.colors.border }]}
                >
                    <Text style={[styles.volumeButtonText, { color: currentTheme.colors.text }]}>
                        -
                    </Text>
                </TouchableOpacity>

                <Text style={[styles.volumeText, { color: currentTheme.colors.text }]}>
                    {currentVolume} {unit}/interval
                </Text>

                <TouchableOpacity
                    onPress={() => updateVolume(currentVolume + 1)}
                    style={[styles.volumeButton, { backgroundColor: currentTheme.colors.border }]}
                >
                    <Text style={[styles.volumeButtonText, { color: currentTheme.colors.text }]}>
                        +
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Add this effect to make sure volume values are initialized correctly for each muscle group
    // Add it after the existing useEffect that initializes muscle groups
    useEffect(() => {
        // Initialize volume values for all muscle groups
        Object.entries(muscleGroupsByCategory).forEach(([category, muscleGroups]) => {
            if (!weeklyVolumePerMuscleGroupPerCategory[category]) {
                weeklyVolumePerMuscleGroupPerCategory[category] = {};
            }

            muscleGroups.forEach((muscleGroup) => {
                if (weeklyVolumePerMuscleGroupPerCategory[category][muscleGroup] === undefined) {
                    // Set default volume (12 for strength/mobility, 20 for endurance)
                    const defaultVolume = category === "endurance" ? 20 : 12;
                    weeklyVolumePerMuscleGroupPerCategory[category][muscleGroup] = defaultVolume;
                }
            });
        });
    }, [muscleGroupsByCategory]);

    const goToNextStep = () => {
        if (
            isSelectionStep(currentStep) &&
            currentMuscleGroupIndex < currentMuscleGroups.length - 1
        ) {
            // Move to the next muscle group within the same step
            setCurrentMuscleGroupIndex(currentMuscleGroupIndex + 1);
        } else if (
            isAdjustmentStep(currentStep) &&
            currentMuscleGroupIndex < currentMuscleGroups.length - 1
        ) {
            // Move to the next muscle group within adjustment step
            setCurrentMuscleGroupIndex(currentMuscleGroupIndex + 1);
        } else if (currentStep === WizardStep.INTRO) {
            // Move from intro to training interval selection
            setCurrentStep(WizardStep.TRAINING_INTERVAL);
        } else if (currentStep === WizardStep.TRAINING_INTERVAL) {
            // Check if strength is enabled, otherwise skip to next enabled category
            if (enabledCategories.strength) {
                setCurrentStep(WizardStep.STRENGTH_OVERVIEW);
            } else if (enabledCategories.mobility) {
                setCurrentStep(WizardStep.MOBILITY_OVERVIEW);
            } else if (enabledCategories.endurance) {
                setCurrentStep(WizardStep.ENDURANCE_OVERVIEW);
            } else {
                // If no categories are enabled, go straight to review
                setCurrentStep(WizardStep.REVIEW);
            }
        } else if (currentStep === WizardStep.STRENGTH_OVERVIEW) {
            // Move from strength category overview to strength exercise selection
            setCurrentStep(WizardStep.STRENGTH_SELECTION);
            setCurrentMuscleGroupIndex(0);
        } else if (
            currentStep === WizardStep.STRENGTH_SELECTION &&
            currentMuscleGroupIndex === currentMuscleGroups.length - 1
        ) {
            // Move to combined adjustment for strength
            setCurrentMuscleGroupIndex(0);
            setCurrentStep(WizardStep.STRENGTH_ADJUSTMENT);
        } else if (
            currentStep === WizardStep.STRENGTH_ADJUSTMENT &&
            currentMuscleGroupIndex === currentMuscleGroups.length - 1
        ) {
            // Check if mobility is enabled, otherwise skip to next enabled category
            if (enabledCategories.mobility) {
                setCurrentStep(WizardStep.MOBILITY_OVERVIEW);
            } else if (enabledCategories.endurance) {
                setCurrentStep(WizardStep.ENDURANCE_OVERVIEW);
            } else {
                setCurrentStep(WizardStep.REVIEW);
            }
        } else if (currentStep === WizardStep.MOBILITY_OVERVIEW) {
            // Move from mobility category overview to mobility exercise selection
            setCurrentStep(WizardStep.MOBILITY_SELECTION);
            setCurrentMuscleGroupIndex(0);
        } else if (
            currentStep === WizardStep.MOBILITY_SELECTION &&
            currentMuscleGroupIndex === currentMuscleGroups.length - 1
        ) {
            // Move to combined adjustment for mobility
            setCurrentMuscleGroupIndex(0);
            setCurrentStep(WizardStep.MOBILITY_ADJUSTMENT);
        } else if (
            currentStep === WizardStep.MOBILITY_ADJUSTMENT &&
            currentMuscleGroupIndex === currentMuscleGroups.length - 1
        ) {
            // Check if endurance is enabled, otherwise skip to review
            if (enabledCategories.endurance) {
                setCurrentStep(WizardStep.ENDURANCE_OVERVIEW);
            } else {
                setCurrentStep(WizardStep.REVIEW);
            }
        } else if (currentStep === WizardStep.ENDURANCE_OVERVIEW) {
            // Move from endurance category overview to endurance exercise selection
            setCurrentStep(WizardStep.ENDURANCE_SELECTION);
            setCurrentMuscleGroupIndex(0);
        } else if (
            currentStep === WizardStep.ENDURANCE_SELECTION &&
            currentMuscleGroupIndex === currentMuscleGroups.length - 1
        ) {
            // Move to combined adjustment for endurance
            setCurrentMuscleGroupIndex(0);
            setCurrentStep(WizardStep.ENDURANCE_ADJUSTMENT);
        } else if (
            currentStep === WizardStep.ENDURANCE_ADJUSTMENT &&
            currentMuscleGroupIndex === currentMuscleGroups.length - 1
        ) {
            // Move to review step
            setCurrentStep(WizardStep.REVIEW);
        } else if (currentStep === WizardStep.REVIEW) {
            // Complete the wizard and save exercises
            completeWizard();
            return;
        } else {
            // Move to the next step
            setCurrentStep(currentStep + 1);
            setCurrentMuscleGroupIndex(0);
        }
    };

    // Update goToPreviousStep
    const goToPreviousStep = () => {
        // If we're not at the first muscle group, go to previous muscle group
        if (currentMuscleGroupIndex > 0) {
            setCurrentMuscleGroupIndex(currentMuscleGroupIndex - 1);
            return;
        }

        // Handle moving to the previous step
        switch (currentStep) {
            case WizardStep.TRAINING_INTERVAL:
                setCurrentStep(WizardStep.INTRO);
                break;

            case WizardStep.STRENGTH_OVERVIEW:
                setCurrentStep(WizardStep.TRAINING_INTERVAL);
                break;

            case WizardStep.STRENGTH_SELECTION:
                setCurrentStep(WizardStep.STRENGTH_OVERVIEW);
                break;

            case WizardStep.STRENGTH_ADJUSTMENT:
                setCurrentStep(WizardStep.STRENGTH_SELECTION);
                // Go to the last muscle group of the selection step
                setCurrentMuscleGroupIndex(muscleGroupsByCategory.strength.length - 1);
                break;

            case WizardStep.MOBILITY_OVERVIEW:
                // Go back to strength adjustment if enabled, otherwise to training interval
                if (enabledCategories.strength) {
                    setCurrentStep(WizardStep.STRENGTH_ADJUSTMENT);
                    setCurrentMuscleGroupIndex(muscleGroupsByCategory.strength.length - 1);
                } else {
                    setCurrentStep(WizardStep.TRAINING_INTERVAL);
                }
                break;

            case WizardStep.MOBILITY_SELECTION:
                setCurrentStep(WizardStep.MOBILITY_OVERVIEW);
                break;

            case WizardStep.MOBILITY_ADJUSTMENT:
                setCurrentStep(WizardStep.MOBILITY_SELECTION);
                // Go to the last muscle group
                setCurrentMuscleGroupIndex(muscleGroupsByCategory.mobility.length - 1);
                break;

            case WizardStep.ENDURANCE_OVERVIEW:
                // Go back to mobility adjustment if enabled, otherwise to strength adjustment or training interval
                if (enabledCategories.mobility) {
                    setCurrentStep(WizardStep.MOBILITY_ADJUSTMENT);
                    setCurrentMuscleGroupIndex(muscleGroupsByCategory.mobility.length - 1);
                } else if (enabledCategories.strength) {
                    setCurrentStep(WizardStep.STRENGTH_ADJUSTMENT);
                    setCurrentMuscleGroupIndex(muscleGroupsByCategory.strength.length - 1);
                } else {
                    setCurrentStep(WizardStep.TRAINING_INTERVAL);
                }
                break;

            case WizardStep.ENDURANCE_SELECTION:
                setCurrentStep(WizardStep.ENDURANCE_OVERVIEW);
                break;

            case WizardStep.ENDURANCE_ADJUSTMENT:
                setCurrentStep(WizardStep.ENDURANCE_SELECTION);
                // Go to the last muscle group
                setCurrentMuscleGroupIndex(muscleGroupsByCategory.endurance.length - 1);
                break;

            case WizardStep.REVIEW:
                // Go back to the last enabled category's adjustment step
                if (enabledCategories.endurance) {
                    setCurrentStep(WizardStep.ENDURANCE_ADJUSTMENT);
                    setCurrentMuscleGroupIndex(muscleGroupsByCategory.endurance.length - 1);
                } else if (enabledCategories.mobility) {
                    setCurrentStep(WizardStep.MOBILITY_ADJUSTMENT);
                    setCurrentMuscleGroupIndex(muscleGroupsByCategory.mobility.length - 1);
                } else if (enabledCategories.strength) {
                    setCurrentStep(WizardStep.STRENGTH_ADJUSTMENT);
                    setCurrentMuscleGroupIndex(muscleGroupsByCategory.strength.length - 1);
                } else {
                    setCurrentStep(WizardStep.TRAINING_INTERVAL);
                }
                break;
        }
    };

    // Update getProgressText to calculate total steps dynamically
    const getProgressText = () => {
        // Calculate total steps based on enabled categories
        let totalSteps = 3; // INTRO, TRAINING_INTERVAL, REVIEW are always included

        if (enabledCategories.strength) totalSteps += 3; // Add steps for strength category
        if (enabledCategories.mobility) totalSteps += 3; // Add steps for mobility category
        if (enabledCategories.endurance) totalSteps += 3; // Add steps for endurance category

        // Calculate current step number
        let currentStepNumber = 1; // Start with 1

        if (currentStep >= WizardStep.TRAINING_INTERVAL) currentStepNumber++;

        if (enabledCategories.strength) {
            if (currentStep >= WizardStep.STRENGTH_OVERVIEW) currentStepNumber++;
            if (currentStep >= WizardStep.STRENGTH_SELECTION) currentStepNumber++;
            if (currentStep >= WizardStep.STRENGTH_ADJUSTMENT) currentStepNumber++;
        }

        if (enabledCategories.mobility) {
            if (currentStep >= WizardStep.MOBILITY_OVERVIEW) currentStepNumber++;
            if (currentStep >= WizardStep.MOBILITY_SELECTION) currentStepNumber++;
            if (currentStep >= WizardStep.MOBILITY_ADJUSTMENT) currentStepNumber++;
        }

        if (enabledCategories.endurance) {
            if (currentStep >= WizardStep.ENDURANCE_OVERVIEW) currentStepNumber++;
            if (currentStep >= WizardStep.ENDURANCE_SELECTION) currentStepNumber++;
            if (currentStep >= WizardStep.ENDURANCE_ADJUSTMENT) currentStepNumber++;
        }

        if (currentStep === WizardStep.REVIEW) currentStepNumber = totalSteps;

        // Simple step indicator
        if (currentStep === WizardStep.INTRO) {
            return `Step 1 of ${totalSteps}`;
        }

        if (currentStep === WizardStep.TRAINING_INTERVAL) {
            return `Step 2 of ${totalSteps}: Training Interval`;
        }

        if (currentStep === WizardStep.REVIEW) {
            return `Step ${totalSteps} of ${totalSteps}: Review Plan`;
        }

        // For overview steps
        if (isOverviewStep(currentStep)) {
            let categoryName = "";
            if (currentStep === WizardStep.STRENGTH_OVERVIEW) categoryName = "Strength";
            if (currentStep === WizardStep.MOBILITY_OVERVIEW) categoryName = "Mobility";
            if (currentStep === WizardStep.ENDURANCE_OVERVIEW) categoryName = "Endurance";

            return `Step ${currentStepNumber} of ${totalSteps}: ${categoryName} Overview`;
        }

        // For selection and adjustment steps
        if (isSelectionStep(currentStep) || isAdjustmentStep(currentStep)) {
            let stepType = "";
            if (isSelectionStep(currentStep)) stepType = "Exercise Selection";
            if (isAdjustmentStep(currentStep)) stepType = "Priority & Volume";

            let categoryName = "";
            if (currentCategory === "strength") categoryName = "Strength";
            if (currentCategory === "mobility") categoryName = "Mobility";
            if (currentCategory === "endurance") categoryName = "Endurance";

            return `Step ${currentStepNumber} of ${totalSteps}: ${categoryName} ${stepType} (${
                currentMuscleGroupIndex + 1
            }/${currentMuscleGroups.length})`;
        }

        return `Step ${currentStepNumber} of ${totalSteps}`;
    };

    const completeWizard = () => {
        // Get the exercise context
        const selectedExercises = allExercises.filter(
            (exercise) =>
                exercise.isSelected && enabledCategories[exercise.category as CategoryType]
        );

        console.log("completed wizard with exercises");
        selectedExercises.forEach(({ isSelected, ...exerciseData }) => {
            addExercise(exerciseData);
        });
        navigation.navigate("Home");
    };

    // Add a new exercise
    const handleAddNewExercise = () => {
        navigation.navigate("AddExercise", {
            muscleGroup: currentMuscleGroup,
            category: currentCategory,
            onSave: (newExercise) => {
                setAllExercises((prev) => [...prev, { ...newExercise, isSelected: true }]);
            },
        });
    };

    // Edit an existing exercise
    const handleEditExercise = (exercise: Exercise & { isSelected: boolean }) => {
        const { isSelected, ...exerciseData } = exercise;

        navigation.navigate("AddExercise", {
            exerciseData,
            muscleGroup: exercise.muscleGroup,
            category: exercise.category,
            onSave: (updatedExercise) => {
                setAllExercises((prevExercises) =>
                    prevExercises.map((ex) =>
                        ex.id === exercise.id ? { ...updatedExercise, isSelected } : ex
                    )
                );
            },
        });
    };

    // Render the priority selector
    const PrioritySelector = ({ exercise }: { exercise: Exercise & { isSelected: boolean } }) => (
        <View style={styles.priorityContainer}>
            <View style={styles.priorityButtons}>
                {[0, 1, 2, 3].map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[
                            styles.priorityButton,
                            {
                                backgroundColor:
                                    exercise.priority === p
                                        ? currentTheme.colors.primary
                                        : currentTheme.colors.border,
                                opacity: p === 0 ? 0.15 : p / 3,
                            },
                        ]}
                        onPress={() => updateExercisePriority(exercise, p)}
                    >
                        <Text
                            style={[
                                styles.priorityText,
                                {
                                    color:
                                        exercise.priority === p
                                            ? "white"
                                            : currentTheme.colors.text,
                                },
                            ]}
                        >
                            {p}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderExerciseItem = ({ item }: { item: Exercise & { isSelected: boolean } }) => (
        <View style={[styles.exerciseItem, { borderColor: currentTheme.colors.border }]}>
            <TouchableOpacity
                style={styles.exerciseContent}
                onPress={() => handleEditExercise(item)}
            >
                <Text style={[styles.exerciseName, { color: currentTheme.colors.text }]}>
                    {item.name}
                </Text>

                {/* Only show sets/week when in VOLUME_ADJUSTMENT or REVIEW step */}
                {(isAdjustmentStep(currentStep) || currentStep === WizardStep.REVIEW) && (
                    <Text style={[styles.exerciseDetails, { color: currentTheme.colors.text }]}>
                        {item.category === "endurance"
                            ? `${item.weeklySets} km/interval`
                            : `${item.weeklySets} sets/interval`}
                    </Text>
                )}

                {/* Show description if available in earlier steps */}
                {isSelectionStep(currentStep) && item.description && (
                    <Text style={[styles.exerciseDetails, { color: currentTheme.colors.text }]}>
                        {item.description}
                    </Text>
                )}
            </TouchableOpacity>

            {isSelectionStep(currentStep) && (
                <Switch
                    value={item.isSelected}
                    onValueChange={() => toggleExercise(item)}
                    trackColor={{
                        false: currentTheme.colors.border,
                        true: currentTheme.colors.primary,
                    }}
                />
            )}

            {isAdjustmentStep(currentStep) && item.isSelected && (
                <PrioritySelector exercise={item} />
            )}
        </View>
    );

    const renderIntroScreen = () => (
        <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                Welcome to Your Volume based Training Plan!
            </Text>

            <Text style={[styles.description, { color: currentTheme.colors.text }]}>
                Overload will help you track progress and volume across three key categories.
                Instead of defining a fixed weekly plan, you'll set volumes and priorities for each
                muscle group and category and train based on your own schedule.
            </Text>

            <Text style={[styles.subtitle, { color: currentTheme.colors.text, marginBottom: 12 }]}>
                Select Training Categories:
            </Text>

            <View style={styles.categoriesContainer}>
                <View style={styles.categoryToggleItem}>
                    <View style={styles.categoryInfo}>
                        <Text
                            style={[styles.categoryTitle, { color: currentTheme.colors.primary }]}
                        >
                            Strength
                        </Text>
                        <Text
                            style={[
                                styles.categoryDescription,
                                { color: currentTheme.colors.text },
                            ]}
                        >
                            Build muscle, strength and bone density with resistance training
                        </Text>
                    </View>
                    <Switch
                        value={enabledCategories.strength}
                        onValueChange={(value) =>
                            setEnabledCategories((prev) => ({ ...prev, strength: value }))
                        }
                        trackColor={{
                            false: currentTheme.colors.border,
                            true: currentTheme.colors.primary,
                        }}
                    />
                </View>

                <View style={styles.categoryToggleItem}>
                    <View style={styles.categoryInfo}>
                        <Text
                            style={[styles.categoryTitle, { color: currentTheme.colors.primary }]}
                        >
                            Mobility
                        </Text>
                        <Text
                            style={[
                                styles.categoryDescription,
                                { color: currentTheme.colors.text },
                            ]}
                        >
                            Improve flexibility, balance, joint health, and range of motion
                        </Text>
                    </View>
                    <Switch
                        value={enabledCategories.mobility}
                        onValueChange={(value) =>
                            setEnabledCategories((prev) => ({ ...prev, mobility: value }))
                        }
                        trackColor={{
                            false: currentTheme.colors.border,
                            true: currentTheme.colors.primary,
                        }}
                    />
                </View>

                <View style={styles.categoryToggleItem}>
                    <View style={styles.categoryInfo}>
                        <Text
                            style={[styles.categoryTitle, { color: currentTheme.colors.primary }]}
                        >
                            Endurance
                        </Text>
                        <Text
                            style={[
                                styles.categoryDescription,
                                { color: currentTheme.colors.text },
                            ]}
                        >
                            Build cardiovascular health and stamina
                        </Text>
                    </View>
                    <Switch
                        value={enabledCategories.endurance}
                        onValueChange={(value) =>
                            setEnabledCategories((prev) => ({ ...prev, endurance: value }))
                        }
                        trackColor={{
                            false: currentTheme.colors.border,
                            true: currentTheme.colors.primary,
                        }}
                    />
                </View>
            </View>

            <Text style={[styles.instruction, { color: currentTheme.colors.text, marginTop: 16 }]}>
                In the next steps, you'll:
            </Text>

            <View style={styles.instructionList}>
                <Text style={[styles.instructionItem, { color: currentTheme.colors.text }]}>
                    • Set your training interval
                </Text>
                <Text style={[styles.instructionItem, { color: currentTheme.colors.text }]}>
                    • Select exercises for each category
                </Text>
                <Text style={[styles.instructionItem, { color: currentTheme.colors.text }]}>
                    • Set priorities for your selected exercises
                </Text>
                <Text style={[styles.instructionItem, { color: currentTheme.colors.text }]}>
                    • Adjust training volume for all muscle groups and categoires
                </Text>
            </View>
        </View>
    );

    // Render the category overview screen
    const renderCategoryOverview = () => (
        <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Training
            </Text>

            <Text style={[styles.description, { color: currentTheme.colors.text }]}>
                {currentCategory === "strength" &&
                    "Strength training builds muscle, increases bone density, and boosts metabolism. Let's select exercises for each muscle group."}
                {currentCategory === "mobility" &&
                    "Mobility exercises improve your range of motion, joint health, and can reduce pain and injury risk."}
                {currentCategory === "endurance" &&
                    "Endurance training improves your cardiovascular health, stamina, and helps with weight management."}
            </Text>

            <Text style={[styles.subtitle, { color: currentTheme.colors.text }]}>
                Muscle Groups:
            </Text>

            <View style={styles.muscleGroupList}>
                {currentMuscleGroups.map((group) => (
                    <Text
                        key={group}
                        style={[styles.muscleGroupItem, { color: currentTheme.colors.text }]}
                    >
                        • {group}
                    </Text>
                ))}
            </View>
        </View>
    );

    const renderExerciseSelection = () => (
        <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                Select {currentMuscleGroup} Exercises
            </Text>

            <Text style={[styles.subtitle, { color: currentTheme.colors.text }]}>
                {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Training
            </Text>

            <Text style={[styles.instruction, { color: currentTheme.colors.text }]}>
                Toggle switches to include or exclude exercises from your plan.
            </Text>

            {/* We'll render the exercises directly, no FlatList */}
            <View style={styles.exerciseListContainer}>
                {currentExercises.map((item) => renderExerciseItem({ item }))}
            </View>

            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: currentTheme.colors.border }]}
                onPress={handleAddNewExercise}
            >
                <Text style={[styles.addButtonText, { color: currentTheme.colors.text }]}>
                    + Add Custom Exercise
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Replace renderPrioritySetting and renderVolumeAdjustment with a combined function
    const renderCombinedAdjustment = () => {
        const unit = currentCategory === "endurance" ? "km" : "sets";

        // Ensure the category and muscle group entries exist
        if (!weeklyVolumePerMuscleGroupPerCategory[currentCategory]) {
            weeklyVolumePerMuscleGroupPerCategory[currentCategory] = {};
        }

        // Use a default value if the volume isn't set yet
        const currentVolume =
            weeklyVolumePerMuscleGroupPerCategory[currentCategory]?.[currentMuscleGroup] ||
            (currentCategory === "endurance" ? 20 : 12);

        return (
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                    Adjust {currentMuscleGroup} Training
                </Text>

                <Text style={[styles.subtitle, { color: currentTheme.colors.text }]}>
                    {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Training
                </Text>

                <View style={styles.volumeContainer}>
                    <Text style={[styles.volumeLabel, { color: currentTheme.colors.text }]}>
                        Interval {unit}:
                    </Text>
                    <View style={styles.volumeControls}>
                        <TouchableOpacity
                            onPress={() => updateVolume(Math.max(1, currentVolume - 1))}
                            style={[
                                styles.volumeButton,
                                { backgroundColor: currentTheme.colors.border },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.volumeButtonText,
                                    { color: currentTheme.colors.text },
                                ]}
                            >
                                -
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.volumeText, { color: currentTheme.colors.text }]}>
                            {currentVolume} {unit}/interval
                        </Text>

                        <TouchableOpacity
                            onPress={() => updateVolume(currentVolume + 1)}
                            style={[
                                styles.volumeButton,
                                { backgroundColor: currentTheme.colors.border },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.volumeButtonText,
                                    { color: currentTheme.colors.text },
                                ]}
                            >
                                +
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[styles.volumeExplanation, { color: currentTheme.colors.text }]}>
                    {currentCategory === "endurance"
                        ? "This is the total distance you'll aim to cover each interval. The volume will be distributed based on exercise priorities."
                        : "This is the total number of sets you'll perform each interval. Sets will be distributed according to your exercise priorities."}
                </Text>

                <Text
                    style={[styles.instruction, { color: currentTheme.colors.text, marginTop: 16 }]}
                >
                    Set the priority level for each exercise (0 = skip, 3 = highest priority).
                </Text>

                <View style={styles.priorityLegend}>
                    <View style={styles.priorityLegendItem}>
                        <View
                            style={[
                                styles.priorityDot,
                                { opacity: 0.15, backgroundColor: currentTheme.colors.primary },
                            ]}
                        />
                        <Text
                            style={[styles.priorityLegendText, { color: currentTheme.colors.text }]}
                        >
                            0: Skip
                        </Text>
                    </View>
                    <View style={styles.priorityLegendItem}>
                        <View
                            style={[
                                styles.priorityDot,
                                { opacity: 0.33, backgroundColor: currentTheme.colors.primary },
                            ]}
                        />
                        <Text
                            style={[styles.priorityLegendText, { color: currentTheme.colors.text }]}
                        >
                            1: Low
                        </Text>
                    </View>
                    <View style={styles.priorityLegendItem}>
                        <View
                            style={[
                                styles.priorityDot,
                                { opacity: 0.66, backgroundColor: currentTheme.colors.primary },
                            ]}
                        />
                        <Text
                            style={[styles.priorityLegendText, { color: currentTheme.colors.text }]}
                        >
                            2: Medium
                        </Text>
                    </View>
                    <View style={styles.priorityLegendItem}>
                        <View
                            style={[
                                styles.priorityDot,
                                { opacity: 1, backgroundColor: currentTheme.colors.primary },
                            ]}
                        />
                        <Text
                            style={[styles.priorityLegendText, { color: currentTheme.colors.text }]}
                        >
                            3: High
                        </Text>
                    </View>
                </View>

                {/* Render selected exercises directly */}
                <View style={styles.exerciseListContainer}>
                    {currentExercises
                        .filter((ex) => ex.isSelected)
                        .map((item) => renderExerciseItem({ item }))}
                </View>
            </View>
        );
    };

    // Render the review screen
    const renderReviewScreen = () => {
        const selectedExerciseCount = allExercises.filter((ex) => ex.isSelected).length;

        return (
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                    Your Plan is Ready!
                </Text>

                <Text style={[styles.description, { color: currentTheme.colors.text }]}>
                    You've selected {selectedExerciseCount} exercises across{" "}
                    {Object.keys(weeklyVolumePerMuscleGroupPerCategory).length} training categories.
                </Text>

                <View style={styles.summaryContainer}>
                    {Object.entries(weeklyVolumePerMuscleGroupPerCategory).map(
                        ([category, muscleGroups]) => (
                            <View key={category} style={styles.categorySummary}>
                                <Text
                                    style={[
                                        styles.categoryTitle,
                                        { color: currentTheme.colors.primary },
                                    ]}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </Text>

                                {Object.entries(muscleGroups).map(([muscleGroup, volume]) => (
                                    <Text
                                        key={muscleGroup}
                                        style={[
                                            styles.summaryItem,
                                            { color: currentTheme.colors.text },
                                        ]}
                                    >
                                        • {muscleGroup}: {volume}{" "}
                                        {category === "endurance" ? "km" : "sets"}/interval
                                    </Text>
                                ))}
                            </View>
                        )
                    )}
                </View>

                <Text style={[styles.instruction, { color: currentTheme.colors.text }]}>
                    Click "Complete" to save your plan and start tracking your progress!
                </Text>
            </View>
        );
    };

    const renderContent = () => {
        switch (currentStep) {
            case WizardStep.INTRO:
                return renderIntroScreen();

            case WizardStep.TRAINING_INTERVAL:
                return renderTrainingIntervalScreen();

            case WizardStep.STRENGTH_OVERVIEW:
            case WizardStep.MOBILITY_OVERVIEW:
            case WizardStep.ENDURANCE_OVERVIEW:
                return renderCategoryOverview();

            case WizardStep.STRENGTH_SELECTION:
            case WizardStep.MOBILITY_SELECTION:
            case WizardStep.ENDURANCE_SELECTION:
                return renderExerciseSelection();

            case WizardStep.STRENGTH_ADJUSTMENT:
            case WizardStep.MOBILITY_ADJUSTMENT:
            case WizardStep.ENDURANCE_ADJUSTMENT:
                return renderCombinedAdjustment();

            case WizardStep.REVIEW:
                return renderReviewScreen();

            default:
                return null;
        }
    };

    const getNextButtonText = () => {
        if (currentStep === WizardStep.REVIEW) {
            return "Complete";
        }

        if (isSelectionStep(currentStep) || isAdjustmentStep(currentStep)) {
            const isLastMuscleGroup = currentMuscleGroupIndex === currentMuscleGroups.length - 1;

            if (isLastMuscleGroup) {
                if (isSelectionStep(currentStep)) {
                    return "Set Priority & Volume";
                } else if (currentStep === WizardStep.ENDURANCE_ADJUSTMENT) {
                    return "Review Plan";
                } else {
                    return "Next Category";
                }
            } else {
                return `Next: ${currentMuscleGroups[currentMuscleGroupIndex + 1]}`;
            }
        }

        return "Next";
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
        >
            <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: currentTheme.colors.text }]}>
                    {getProgressText()}
                </Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                {renderContent()}
            </ScrollView>

            <View style={styles.buttonContainer}>
                {currentStep > WizardStep.INTRO && (
                    <TouchableOpacity
                        style={[styles.backButton, { borderColor: currentTheme.colors.border }]}
                        onPress={goToPreviousStep}
                    >
                        <Text style={[styles.backButtonText, { color: currentTheme.colors.text }]}>
                            Back
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: currentTheme.colors.primary }]}
                    onPress={goToNextStep}
                >
                    <Text
                        style={[styles.nextButtonText, { color: currentTheme.colors.background }]}
                    >
                        {getNextButtonText()}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    progressText: {
        fontSize: 14,
        fontWeight: "500",
    },
    skipButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
        marginTop: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    },
    instruction: {
        fontSize: 16,
        marginBottom: 16,
        fontStyle: "italic",
    },
    instructionList: {
        marginBottom: 20,
    },
    instructionItem: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 8,
    },
    categoriesContainer: {
        marginVertical: 16,
    },
    categoryItem: {
        marginBottom: 16,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 6,
    },
    categoryDescription: {
        fontSize: 16,
        lineHeight: 22,
    },
    muscleGroupList: {
        marginVertical: 12,
    },
    muscleGroupItem: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 8,
    },
    exerciseListContainer: {
        marginTop: 12,
        marginBottom: 20,
    },
    exerciseItem: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    exerciseContent: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 14,
    },
    addButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 20,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
    priorityContainer: {
        flexDirection: "row",
        alignItems: "center",
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
    priorityLegend: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        flexWrap: "wrap",
    },
    priorityLegendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
        marginBottom: 8,
    },
    priorityDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 6,
    },
    priorityLegendText: {
        fontSize: 14,
    },
    volumeContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 16,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#eee",
    },
    volumeLabel: {
        fontSize: 16,
        fontWeight: "500",
    },
    volumeControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center", // Added to center the controls
        minWidth: 150, // Added minimum width to prevent shrinking
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
        fontSize: 16,
        fontWeight: "500",
        width: 120, // Changed from minWidth to fixed width
        textAlign: "center",
    },
    volumeExplanation: {
        fontSize: 14,
        fontStyle: "italic",
        marginTop: 8,
    },
    summaryContainer: {
        marginVertical: 16,
    },
    categorySummary: {
        marginBottom: 16,
    },
    summaryItem: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 6,
        marginLeft: 8,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    backButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        borderWidth: 1,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
    nextButton: {
        flex: 2,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    pickerContainer: {
        borderWidth: 1,
        // borderColor: currentTheme.colors.border,
        borderRadius: 8,
        marginVertical: 16,
        // backgroundColor: currentTheme.colors.card,
    },
    categoryToggleItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#eee",
    },
    categoryInfo: {
        flex: 1,
        marginRight: 12,
    },
});

export default OnboardingWizard;
