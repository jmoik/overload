import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, TextInput, Button, Alert, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { AddExerciseScreenNavigationProp, AddExerciseScreenRouteProp } from "../types/navigation";
import { Exercise, Set } from "../contexts/Exercise";
import { lightTheme, darkTheme, createAddExerciseStyles } from "../../styles/globalStyles";
import { useTheme } from "../contexts/ThemeContext";
import { Text } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Swipeable } from "react-native-gesture-handler";
import { Icon } from "react-native-elements";

const AddExerciseScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createAddExerciseStyles(currentTheme);
    const { addExercise, deleteExercise, updateExercise, exercises } = useExerciseContext();
    const navigation = useNavigation<AddExerciseScreenNavigationProp>();
    const route = useRoute<AddExerciseScreenRouteProp>();
    const exerciseId = route.params?.exerciseId;

    // Prefill muscle group and category if coming from PlanPreviewScreen
    const prefillMuscleGroup = route.params?.muscleGroup || "";
    const prefillCategory = route.params?.category || "strength";

    const [name, setName] = useState("");
    const [category, setCategory] = useState(prefillCategory as Exercise["category"]);
    const [description, setDescription] = useState("");
    const [muscleGroup, setMuscleGroup] = useState(prefillMuscleGroup);
    const [distance, setDistance] = useState("");
    const [oneRepMax, setOneRepMax] = useState("");
    const [workout, setWorkout] = useState<Set[]>([]);

    // Dropdown state
    const [open, setOpen] = useState(false);
    const [items] = useState([
        { label: "Strength", value: "strength" },
        { label: "Endurance", value: "endurance" },
        { label: "Mobility", value: "mobility" },
        { label: "nSuns", value: "nsuns" },
    ]);

    useEffect(() => {
        if (route.params?.exerciseData) {
            handleEditExerciseFromPreview(route.params.exerciseData);
        } else if (exerciseId) {
            const exercise = exercises.find((e) => e.id === exerciseId);
            if (exercise) {
                setName(exercise.name);
                setCategory(exercise.category);
                setDescription(exercise.description);
                setMuscleGroup(exercise.muscleGroup);
                setDistance(exercise.distance?.toString() || "0");
                if (exercise.category === "nsuns") {
                    setOneRepMax(exercise.oneRepMax?.toString() || "");
                    setWorkout(exercise.workout || []);
                }
            }
        }
    }, [exerciseId, exercises]);

    const handleAddOrUpdateExercise = () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        const exerciseData: Omit<Exercise, "id"> = {
            name,
            // Default value for weeklySets based on category
            weeklySets: category === "endurance" ? 1 : 10, // Default to 10 sets for non-endurance
            category,
            description,
            muscleGroup,
            distance: category === "endurance" ? parseFloat(distance) : undefined,
            oneRepMax: category === "nsuns" ? parseFloat(oneRepMax) : undefined,
            workout: category === "nsuns" ? workout : undefined,
        };

        if (route.params?.onSave) {
            route.params.onSave({ ...exerciseData, id: exerciseId || Date.now().toString() });
        } else if (exerciseId) {
            updateExercise(exerciseId, exerciseData);
        } else {
            addExercise({ ...exerciseData, id: Date.now().toString() });
        }

        navigation.goBack();
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                exerciseId ? (
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                "Delete Exercise",
                                "Are you sure you want to delete this exercise?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Delete",
                                        style: "destructive",
                                        onPress: () => {
                                            deleteExercise(exerciseId);
                                            navigation.goBack();
                                        },
                                    },
                                ]
                            );
                        }}
                        style={{ marginRight: 15 }}
                    >
                        <Icon name="delete" size={24} color="#FF0000" />
                    </TouchableOpacity>
                ) : undefined,
        });
    }, [navigation, exerciseId, deleteExercise, currentTheme.colors.primary]);

    const handleAddSet = () => {
        setWorkout([...workout, { reps: 0, relativeWeight: 0, isAMRAP: false }]);
    };

    const handleUpdateSet = (index: number, field: keyof Set, value: string | boolean) => {
        const updatedWorkout = [...workout];
        if (field === "isAMRAP") {
            updatedWorkout[index][field] = value as boolean;
        } else {
            const numValue =
                field === "reps" ? parseInt(value as string, 10) : parseFloat(value as string);
            updatedWorkout[index][field] = isNaN(numValue) ? 0 : numValue;
        }
        setWorkout(updatedWorkout);
    };

    const handleEditExerciseFromPreview = (exerciseData: Exercise) => {
        setName(exerciseData.name);
        setCategory(exerciseData.category);
        setDescription(exerciseData.description);
        setMuscleGroup(exerciseData.muscleGroup);
        setDistance(exerciseData.distance?.toString() || "");
    };

    const handleRemoveSet = (index: number) => {
        const updatedWorkout = workout.filter((_, i) => i !== index);
        setWorkout(updatedWorkout);
    };

    const renderRightActions = (index: number) => {
        return (
            <TouchableOpacity style={styles.deleteAction} onPress={() => handleRemoveSet(index)}>
                <Icon name="delete" size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const renderSet = (set: Set, index: number) => {
        return (
            <Swipeable renderRightActions={() => renderRightActions(index)} rightThreshold={40}>
                <View style={styles.setContainer}>
                    <TextInput
                        style={styles.setInput}
                        placeholder="Reps"
                        placeholderTextColor={currentTheme.colors.placeholder}
                        value={set.reps === 0 ? "" : set.reps.toString()}
                        onChangeText={(value) => handleUpdateSet(index, "reps", value)}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={styles.setInput}
                        placeholder="Relative Weight (%)"
                        placeholderTextColor={currentTheme.colors.placeholder}
                        value={set.relativeWeight === 0 ? "" : set.relativeWeight.toString()}
                        onChangeText={(value) => handleUpdateSet(index, "relativeWeight", value)}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity
                        style={[styles.amrapButton, set.isAMRAP && styles.amrapButtonActive]}
                        onPress={() => handleUpdateSet(index, "isAMRAP", !set.isAMRAP)}
                    >
                        <Text style={styles.amrapButtonText}>AMRAP</Text>
                    </TouchableOpacity>
                </View>
            </Swipeable>
        );
    };

    return (
        <View style={styles.screen}>
            <ScrollView style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Exercise Name"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={name}
                    onChangeText={setName}
                />

                <View style={styles.dropdownContainer}>
                    <DropDownPicker
                        open={open}
                        value={category}
                        items={items}
                        setOpen={setOpen}
                        setValue={setCategory}
                        theme={theme === "dark" ? "DARK" : "LIGHT"}
                        style={{
                            backgroundColor: currentTheme.colors.surface,
                            borderColor: currentTheme.colors.border,
                        }}
                        textStyle={{
                            color: currentTheme.colors.text,
                        }}
                        dropDownContainerStyle={{
                            backgroundColor: currentTheme.colors.surface,
                            borderColor: currentTheme.colors.border,
                        }}
                        zIndex={3000}
                        zIndexInverse={1000}
                    />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Muscle Group"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={muscleGroup}
                    onChangeText={setMuscleGroup}
                />
                {category === "endurance" && (
                    <TextInput
                        style={styles.input}
                        placeholder="Total Interval Distance (km)"
                        placeholderTextColor={currentTheme.colors.placeholder}
                        value={distance}
                        onChangeText={setDistance}
                        keyboardType="numeric"
                    />
                )}
                <TextInput
                    style={styles.input}
                    placeholder="Description"
                    placeholderTextColor={currentTheme.colors.placeholder}
                    value={description}
                    onChangeText={setDescription}
                />
                {category === "nsuns" && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="One Rep Max"
                            placeholderTextColor={currentTheme.colors.placeholder}
                            value={oneRepMax}
                            onChangeText={setOneRepMax}
                            keyboardType="numeric"
                        />
                        <Text style={styles.sectionTitle}>Workout Sets</Text>
                        {workout.map((set, index) => renderSet(set, index))}
                        <Button title="Add Set" onPress={handleAddSet} />
                    </>
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title={exerciseId ? "Update Exercise" : "Add Exercise"}
                        onPress={handleAddOrUpdateExercise}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

export default AddExerciseScreen;
