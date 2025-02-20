// screens/RoutinesScreen.tsx
import React, { useLayoutEffect, useCallback, useRef, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../../styles/globalStyles";
import { Routine } from "../../contexts/Routine";
import { useRoutineContext } from "../../contexts/RoutineContext";

const createRoutinesStyles = (theme: typeof lightTheme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    routineItem: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: theme.colors.card,
        marginVertical: 4,
        marginHorizontal: 8,
        borderRadius: 8,
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    routineInfo: {
        flex: 1,
    },
    routineName: {
        fontSize: 18,
        fontWeight: "600",
        color: theme.colors.text,
        marginBottom: 4,
    },
    routineDescription: {
        fontSize: 14,
        color: theme.colors.secondaryText,
    },
    exerciseCount: {
        fontSize: 14,
        color: theme.colors.primary,
    },
    deleteButton: {
        backgroundColor: theme.colors.error,
        justifyContent: "center",
        alignItems: "center",
        width: 70,
        height: "100%",
    },
    editButton: {
        backgroundColor: theme.colors.primary,
        justifyContent: "center",
        alignItems: "center",
        width: 70,
        height: "100%",
    },
    headerButton: {
        marginHorizontal: 8,
    },
});

const RoutinesScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createRoutinesStyles(currentTheme);
    const navigation = useNavigation();
    const { routines, deleteRoutine } = useRoutineContext();
    const swipeableRefs = useRef<(Swipeable | null)[]>([]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("AddRoutine")}
                    style={styles.headerButton}
                >
                    <Icon name="add-circle" size={24} color={currentTheme.colors.primary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleRoutinePress = (routineId: string) => {
        navigation.navigate("RoutineDetail", { routineId });
    };

    const handleDeleteRoutine = useCallback(
        (routineId: string, routineName: string) => {
            Alert.alert("Delete Routine", `Are you sure you want to delete ${routineName}?`, [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => {
                        deleteRoutine(routineId);
                        swipeableRefs.current.forEach((ref) => ref?.close());
                    },
                    style: "destructive",
                },
            ]);
        },
        [deleteRoutine]
    );

    const renderRightActions = useCallback(
        (routineId: string, routineName: string) => {
            return (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRoutine(routineId, routineName)}
                >
                    <Icon name="trash-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            );
        },
        [handleDeleteRoutine]
    );

    const handleEditRoutine = useCallback(
        (routineId: string, index: number) => {
            navigation.navigate("AddRoutine", { routineId });
            swipeableRefs.current[index]?.close();
        },
        [navigation]
    );

    const renderLeftActions = useCallback(() => {
        return (
            <View style={styles.editButton}>
                <Icon name="create-outline" size={24} color="#FFFFFF" />
            </View>
        );
    }, []);

    const renderRoutineItem = ({ item, index }: { item: Routine; index: number }) => (
        <Swipeable
            ref={(el) => (swipeableRefs.current[index] = el)}
            renderRightActions={() => renderRightActions(item.id, item.name)}
            renderLeftActions={renderLeftActions}
            onSwipeableLeftOpen={() => handleEditRoutine(item.id, index)}
            rightThreshold={40}
            leftThreshold={40}
        >
            <TouchableOpacity
                style={styles.routineItem}
                onPress={() => handleRoutinePress(item.id)}
            >
                <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{item.name}</Text>
                    {item.description && (
                        <Text style={styles.routineDescription}>{item.description}</Text>
                    )}
                    <Text style={styles.exerciseCount}>{item.exercises.length} exercises</Text>
                </View>
                <Icon name="chevron-forward" size={24} color={currentTheme.colors.primary} />
            </TouchableOpacity>
        </Swipeable>
    );

    const sortedRoutines = useMemo(() => {
        return [...routines].sort((a, b) => a.name.localeCompare(b.name));
    }, [routines]);

    return (
        <View style={styles.container}>
            <FlatList
                data={sortedRoutines}
                renderItem={renderRoutineItem}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
};

export default RoutinesScreen;
