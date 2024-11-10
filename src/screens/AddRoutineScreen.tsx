// screens/AddRoutineScreen.tsx
import React, { useState, useEffect, useLayoutEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Alert,
    Switch,
    StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRoutineContext } from "../contexts/RoutineContext";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { Exercise } from "../contexts/Exercise";
import { lightTheme, darkTheme } from "../../styles/globalStyles";

const createStyles = (theme: typeof lightTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: 16,
        },
        inputContainer: {
            marginBottom: 20,
        },
        label: {
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.text,
            marginBottom: 8,
        },
        input: {
            backgroundColor: theme.colors.card,
            borderRadius: 8,
            padding: 12,
            color: theme.colors.text,
            fontSize: 16,
        },
        descriptionInput: {
            height: 80,
            textAlignVertical: "top",
        },
        exerciseSection: {
            flex: 1,
        },
        exerciseList: {
            flex: 1,
        },
        exerciseItem: {
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            backgroundColor: theme.colors.card,
            marginVertical: 4,
            borderRadius: 8,
        },
        exerciseInfo: {
            flex: 1,
        },
        exerciseName: {
            fontSize: 16,
            fontWeight: "500",
            color: theme.colors.text,
        },
        separator: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 16,
        },
        selectedExercisesHeader: {
            fontSize: 18,
            fontWeight: "600",
            color: theme.colors.text,
            marginVertical: 12,
        },
        selectedExercise: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.card,
            padding: 12,
            marginVertical: 4,
            borderRadius: 8,
        },
        removeButton: {
            padding: 8,
        },
        errorText: {
            color: theme.colors.error,
            marginTop: 4,
        },
        headerButton: {
            marginHorizontal: 16,
        },
        headerButtonText: {
            color: theme.colors.primary,
            fontSize: 16,
            fontWeight: "600",
        },
    });

const AddRoutineScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { theme } = useTheme();
    const styles = createStyles(theme === "light" ? lightTheme : darkTheme);
    const { exercises } = useExerciseContext();
    const { addRoutine, updateRoutine, routines } = useRoutineContext();

    const routineId = route.params?.routineId;
    const existingRoutine = routines.find((r) => r.id === routineId);

    const [name, setName] = useState(existingRoutine?.name || "");
    const [description, setDescription] = useState(existingRoutine?.description || "");
    const [selectedExercises, setSelectedExercises] = useState<string[]>(
        existingRoutine?.exercises || []
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [nameError, setNameError] = useState("");

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>Save</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, name, description, selectedExercises]);

    const filteredExercises = exercises.filter(
        (exercise) =>
            exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedExercises.includes(exercise.id)
    );

    const handleSave = async () => {
        if (!name.trim()) {
            setNameError("Routine name is required");
            return;
        }

        if (selectedExercises.length === 0) {
            Alert.alert("Error", "Please select at least one exercise for the routine");
            return;
        }

        try {
            const routineData = {
                name: name.trim(),
                description: description.trim(),
                exercises: selectedExercises,
            };

            if (existingRoutine) {
                await updateRoutine({
                    ...existingRoutine,
                    ...routineData,
                });
            } else {
                await addRoutine(routineData);
            }

            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to save routine");
        }
    };

    const toggleExercise = (exerciseId: string) => {
        setSelectedExercises((prev) => {
            if (prev.includes(exerciseId)) {
                return prev.filter((id) => id !== exerciseId);
            }
            return [...prev, exerciseId];
        });
    };

    const removeExercise = (exerciseId: string) => {
        setSelectedExercises((prev) => prev.filter((id) => id !== exerciseId));
    };

    const renderExerciseItem = ({ item }: { item: Exercise }) => (
        <TouchableOpacity style={styles.exerciseItem} onPress={() => toggleExercise(item.id)}>
            <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text>{item.category}</Text>
            </View>
            <Icon
                name="add-circle-outline"
                size={24}
                color={theme === "light" ? lightTheme.colors.primary : darkTheme.colors.primary}
            />
        </TouchableOpacity>
    );

    const renderSelectedExercise = (exerciseId: string) => {
        const exercise = exercises.find((e) => e.id === exerciseId);
        if (!exercise) return null;

        return (
            <View key={exerciseId} style={styles.selectedExercise}>
                <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeExercise(exerciseId)}
                >
                    <Icon
                        name="remove-circle-outline"
                        size={24}
                        color={theme === "light" ? lightTheme.colors.error : darkTheme.colors.error}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Routine Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            setNameError("");
                        }}
                        placeholder="Enter routine name"
                        placeholderTextColor={
                            theme === "light" ? lightTheme.colors.text : darkTheme.colors.text
                        }
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter routine description"
                        placeholderTextColor={
                            theme === "light" ? lightTheme.colors.text : darkTheme.colors.text
                        }
                        multiline
                    />
                </View>

                <View style={styles.exerciseSection}>
                    <Text style={styles.label}>Search Exercises</Text>
                    <TextInput
                        style={styles.input}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search exercises..."
                        placeholderTextColor={
                            theme === "light" ? lightTheme.colors.text : darkTheme.colors.text
                        }
                    />

                    <Text style={styles.selectedExercisesHeader}>
                        Selected Exercises ({selectedExercises.length})
                    </Text>
                    {selectedExercises.map(renderSelectedExercise)}

                    <View style={styles.separator} />

                    <Text style={styles.label}>Available Exercises</Text>
                    <FlatList
                        data={filteredExercises}
                        renderItem={renderExerciseItem}
                        keyExtractor={(item) => item.id}
                        style={styles.exerciseList}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

export default AddRoutineScreen;
