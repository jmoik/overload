// screens/AddExerciseScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, Button, Alert, TouchableOpacity, Modal, FlatList } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { AddExerciseScreenNavigationProp, AddExerciseScreenRouteProp } from "../types/navigation";
import { Exercise, ExerciseCategory } from "../models/Exercise";
import { lightTheme, darkTheme, createAddExerciseStyles } from "../styles/globalStyles";
import { useTheme } from "../contexts/ThemeContext";
import { Text } from "react-native";
import { Picker } from "@react-native-picker/picker";

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
    const [category, setCategory] = useState<ExerciseCategory>("strength");
    const [description, setDescription] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");
    const [distance, setDistance] = useState("");

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
                setWeeklySets(exercise.weeklySets.toString());
                setTargetRPE(exercise.targetRPE.toString());
                setDistance(exercise.distance?.toString() || "");
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

        if (route.params?.onSave) {
            route.params.onSave({ ...exerciseData, id: exerciseId || Date.now().toString() });
        } else if (exerciseId) {
            updateExercise(exerciseId, exerciseData);
        } else {
            addExercise({ ...exerciseData, id: Date.now().toString() });
        }

        navigation.goBack();
    };

    const handleEditExerciseFromPreview = (exerciseData: Exercise) => {
        setName(exerciseData.name);
        setWeeklySets(exerciseData.weeklySets.toString());
        setTargetRPE(exerciseData.targetRPE.toString());
        setCategory(exerciseData.category);
        setDescription(exerciseData.description);
        setMuscleGroup(exerciseData.muscleGroup);
        setDistance(exerciseData.distance?.toString() || "");
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
            <View style={styles.pickerContainer}>
                <Text style={styles.placeholderText}>Select Category</Text>
                <Picker
                    style={styles.picker}
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue as ExerciseCategory)}
                >
                    <Picker.Item label="Strength" value="strength" />
                    <Picker.Item label="Endurance" value="endurance" />
                    <Picker.Item label="Mobility" value="mobility" />
                    <Picker.Item label="Other" value="other" />
                </Picker>
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
                    placeholder="Distance (km)"
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
            <Button
                title={exerciseId ? "Update Exercise" : "Add Exercise"}
                onPress={handleAddOrUpdateExercise}
            />
        </View>
    );
};

export default AddExerciseScreen;
