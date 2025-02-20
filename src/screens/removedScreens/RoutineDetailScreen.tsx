// screens/RoutineScreen.tsx
import { useRoute } from "@react-navigation/native";
import { useRoutineContext } from "../contexts/RoutineContext";
import React, { useLayoutEffect, useCallback, useRef, useEffect, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { Swipeable } from "react-native-gesture-handler";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { RoutineScreenNavigationProp } from "../types/navigation";
import {
    EnduranceExerciseHistoryEntry,
    Exercise,
    ExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../contexts/Exercise";

import { subDays, isAfter } from "date-fns";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createAllExercisesStyles } from "../../styles/globalStyles";

const RoutineDetailScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createAllExercisesStyles(currentTheme);
    const navigation = useNavigation<RoutineScreenNavigationProp>();
    const { exercises, deleteExercise, exerciseHistory, trainingInterval } = useExerciseContext();
    const [sortBySetsLeft, setSortBySetsLeft] = useState(true);
    const [hideCompleted, setHideCompleted] = useState(false);
    const route = useRoute();
    const { routineId } = route.params;
    const { routines } = useRoutineContext();
    
    const routine = routines.find((r) => r.id === routineId);
    const routineExercises = exercises.filter((exercise) =>
            routine?.exercises.includes(exercise.id)
        );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null,
            headerRight: () => null,
        });
    }, [navigation]);

    const handleExercisePress = (exerciseId: string) => {
        navigation.navigate("ExerciseHistory", { exerciseId });
    };


    const calculateRemainingSets = useCallback(
        (exercise: Exercise) => {
            const today = new Date();
            const intervalStart = subDays(today, trainingInterval);

            const history = exerciseHistory[exercise.id] || [];
            const setsDoneInInterval = history.reduce((total, entry: ExerciseHistoryEntry) => {
                if (isAfter(new Date(entry.date), intervalStart)) {
                    // cast to StrengthExerciseHistoryEntry to access the sets property
                    if (entry.category === "strength") {
                        return total + (entry as StrengthExerciseHistoryEntry).sets;
                    } else if (entry.category === "mobility") {
                        return total + (entry as MobilityExerciseHistoryEntry).sets;
                    } else if (entry.category === "endurance") {
                        return total + (entry as EnduranceExerciseHistoryEntry).distance;
                    }
                }
                return total;
            }, 0);

            let remainingSets = exercise.weeklySets - setsDoneInInterval;

            // for endurance set use distance
            if (exercise.category === "endurance") {
                remainingSets = exercise.weeklySets * (exercise.distance ?? 0) - setsDoneInInterval;
            }
            return remainingSets;
        },
        [exerciseHistory, trainingInterval]
    );

    const groupedAndSortedExercises = React.useMemo(() => {
        let filteredExercises = routineExercises;

        const grouped = filteredExercises.reduce((acc, exercise) => {
            const key = exercise.category;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(exercise);
            return acc;
        }, {} as Record<string, Exercise[]>);

        Object.keys(grouped).forEach((key) => {
            grouped[key].sort((a, b) => {
                if (sortBySetsLeft) {
                    return calculateRemainingSets(b) - calculateRemainingSets(a);
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
        });

        const sortedKeys = Object.keys(grouped).sort();

        return sortedKeys.map((key) => ({
            title: key,
            data: grouped[key],
            key: `${key}`,
        }));
    }, [exercises, sortBySetsLeft, calculateRemainingSets, hideCompleted]);

    const renderExerciseItem = useCallback(
        ({
            item,
            index,
            section,
        }: {
            item: Exercise;
            index: number;
            section: { title: string };
        }) => {
            const remainingTrainingLoad = calculateRemainingSets(item);
            const setsLeft = remainingTrainingLoad;
            const setsLeftColor = setsLeft <= 0 ? "green" : "red";

            const weeklySetsText =
                item.category === "endurance"
                    ? `${item.weeklySets * item.distance!} km / interval`
                    : `${item.weeklySets} sets / interval`;

            const setsLeftText =
                item.category === "endurance"
                    ? `${setsLeft.toFixed(1)} km left`
                    : `Sets left: ${setsLeft}`;

            return (
                    <TouchableOpacity
                        style={styles.exerciseItem}
                        onPress={() => handleExercisePress(item.id)}
                    >
                        <View style={styles.exerciseItemLeft}>
                            <Text style={styles.exerciseName}>{item.name}</Text>
                            <Text style={styles.exerciseDescription}>{item.description}</Text>
                            <Text style={styles.exerciseSetsPerWeek}>{weeklySetsText}</Text>
                        </View>
                        <View style={styles.exerciseItemRight}>
                            <Text style={[styles.remainingSets, { color: setsLeftColor }]}>
                                {setsLeftText}
                            </Text>
                        </View>
                    </TouchableOpacity>
            );
        },
        [
            handleExercisePress,
            calculateRemainingSets,
        ]
    );

    return (
        <View style={styles.container}>
            <SectionList
                sections={groupedAndSortedExercises}
                keyExtractor={(item, index) => `${item.id}-${index}`} // Use both id and index for extra uniqueness
                renderItem={renderExerciseItem}
            />
        </View>
    );
};

export default RoutineDetailScreen;
