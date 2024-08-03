// screens/AddExerciseScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { AddExerciseScreenNavigationProp, AddExerciseScreenRouteProp } from "../types/navigation";
import { Exercise } from "../models/Exercise";
import { lightTheme, darkTheme, createAddExerciseStyles } from "../styles/globalStyles";
import { useTheme } from "../contexts/ThemeContext";

const AddExerciseScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createAddExerciseStyles(currentTheme);
    const { addExercise, updateExercise, exercises, meanRpe } = useExerciseContext();
    const navigation = useNavigation<AddExerciseScreenNavigationProp>();
    const route = useRoute<AddExerciseScreenRouteProp>();
    const exerciseId = route.params?.exerciseId;

    const [name, setName] = useState("");
    const [weeklySets, setWeeklySets] = useState("");
    const [targetRPE, setTargetRPE] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");

    useEffect(() => {
        if (exerciseId) {
            const exercise = exercises.find((e) => e.id === exerciseId);
            if (exercise) {
                setName(exercise.name);
                setCategory(exercise.category);
                setDescription(exercise.description);
                setMuscleGroup(exercise.muscleGroup);
                setWeeklySets(exercise.weeklySets.toString());
                setTargetRPE(exercise.targetRPE.toString());
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
            weeklySets: parseInt(weeklySets, 10),
            targetRPE: parseInt(targetRPE, 10) || meanRpe,
            category,
            description,
            muscleGroup,
        };

        if (exerciseId) {
            updateExercise(exerciseId, exerciseData);
        } else {
            addExercise({ ...exerciseData, id: Date.now().toString() });
        }

        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Exercise Name"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Weekly Sets"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={weeklySets}
                onChangeText={setWeeklySets}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Target RPE"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={targetRPE}
                onChangeText={setTargetRPE}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Category"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={category}
                onChangeText={setCategory}
            />
            <TextInput
                style={styles.input}
                placeholder="Muscle Group"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={muscleGroup}
                onChangeText={setMuscleGroup}
            />
            <TextInput
                style={styles.input}
                placeholder="Description"
                placeholderTextColor={currentTheme.colors.placeholder}
                value={description}
                onChangeText={setDescription}
            />
            <Button
                title={exerciseId ? "Update Exercise" : "Add Exercise"}
                onPress={handleAddOrUpdateExercise}
            />
        </View>
    );
};

export default AddExerciseScreen;
