// styles/globalStyles.ts

import { StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";

export const lightTheme = {
    colors: {
        background: "#FFFFFF",
        text: "#000000",
        primary: "#007AFF",
        secondary: "#5856D6",
        card: "#F2F2F7",
        border: "#C7C7CC",
        notification: "#FF3B30",
        surface: "#FFFFFF",
        onSurface: "#000000",
        disabled: "#CCCCCC",
        placeholder: "#999999",
        elevation: {
            1: "#F5F5F5",
            2: "#EEEEEE",
            3: "#E0E0E0",
            4: "#D6D6D6",
            5: "#CCCCCC",
        },
    },
};

export const darkTheme = {
    colors: {
        background: "#000000",
        text: "#FFFFFF",
        primary: "#0A84FF",
        secondary: "#5E5CE6",
        card: "#1C1C1E",
        border: "#2C2C2E",
        notification: "#FF453A",
        surface: "#121212",
        onSurface: "#E1E1E1",
        disabled: "#666666",
        placeholder: "#9E9E9E",
        elevation: {
            1: "#1E1E1E",
            2: "#222222",
            3: "#242424",
            4: "#272727",
            5: "#2C2C2C",
        },
    },
};

export const navigationTheme: { light: Theme; dark: Theme } = {
    light: {
        dark: false,
        colors: {
            ...lightTheme.colors,
            primary: lightTheme.colors.primary,
            background: lightTheme.colors.background,
            card: lightTheme.colors.card,
            text: lightTheme.colors.text,
            border: lightTheme.colors.border,
            notification: lightTheme.colors.notification,
        },
    },
    dark: {
        dark: true,
        colors: {
            ...darkTheme.colors,
            primary: darkTheme.colors.primary,
            background: darkTheme.colors.background,
            card: darkTheme.colors.card,
            text: darkTheme.colors.text,
            border: darkTheme.colors.border,
            notification: darkTheme.colors.notification,
        },
    },
};

// Global styles
const createGlobalStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        text: {
            color: theme.colors.text,
            fontSize: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            color: theme.colors.text,
            marginBottom: 20,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
        },
        button: {
            backgroundColor: theme.colors.primary,
            padding: 10,
            borderRadius: 5,
            alignItems: "center",
        },
        buttonText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "bold",
        },
        // ... add more global styles as needed
    });

// AllExercisesScreen specific styles
const createAllExercisesScreenStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        addButton: {
            marginRight: 15,
        },
        exerciseItem: {
            backgroundColor: theme.colors.card,
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        exerciseName: {
            fontSize: 18,
            fontWeight: "bold",
            color: theme.colors.text,
        },
        deleteButton: {
            backgroundColor: theme.colors.notification,
            justifyContent: "center",
            alignItems: "center",
            width: 80,
            height: "100%",
        },
        sectionHeader: {
            paddingVertical: 5,
            paddingHorizontal: 10,
            fontSize: 14,
            fontWeight: "bold",
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
        },
        editButton: {
            backgroundColor: theme.colors.primary,
            justifyContent: "center",
            alignItems: "center",
            width: 80,
            height: "100%",
        },
        remainingSets: {
            marginTop: 5,
            fontWeight: "bold",
            color: theme.colors.primary,
        },
    });

// AddExerciseScreen specific styles
const createAddExerciseScreenStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: theme.colors.background,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
        },
        // ... add more styles as needed
    });

// ExerciseHistoryScreen specific styles
const createExerciseHistoryScreenStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 15,
        },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
        },
        inputContainer: {
            flexDirection: "row",
            marginBottom: 20,
        },
        input: {
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginRight: 10,
            borderRadius: 5,
        },
        historyItem: {
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#ccc",
            marginBottom: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        deleteButton: {
            backgroundColor: "#FF3B30",
            justifyContent: "center",
            alignItems: "center",
            width: 80,
            height: "100%",
        },
        oneRepMax: {
            color: "#666",
            fontWeight: "bold",
            textAlign: "right",
        },
        timerContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
        },
        timerText: { fontSize: 20, fontWeight: "bold" },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
        },
        headerButtons: {
            flexDirection: "row",
            alignItems: "center",
        },
        fillButton: {
            backgroundColor: "#f0f0f0",
            marginRight: 20,
            marginBottom: 20,
        },
        dateButton: {
            backgroundColor: "#f0f0f0",
            padding: 10,
            borderRadius: 5,
            marginBottom: 20,
        },
        sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
    });

// SettingsScreen specific styles
const createSettingsStylesScreenStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        settingItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        settingTitle: {
            fontSize: 16,
            color: theme.colors.text,
        },
    });

export const createAllExercisesStyles = (theme: typeof lightTheme | typeof darkTheme) => ({
    ...createGlobalStyles(theme),
    ...createAllExercisesScreenStyles(theme),
});

export const createAddExerciseStyles = (theme: typeof lightTheme | typeof darkTheme) => ({
    ...createGlobalStyles(theme),
    ...createAddExerciseScreenStyles(theme),
});

export const createExerciseHistoryStyles = (theme: typeof lightTheme | typeof darkTheme) => ({
    ...createGlobalStyles(theme),
    ...createExerciseHistoryScreenStyles(theme),
});

export const createSettingsStyles = (theme: typeof lightTheme | typeof darkTheme) => ({
    ...createGlobalStyles(theme),
    ...createSettingsStylesScreenStyles(theme),
});

export type GlobalStyles = ReturnType<typeof createGlobalStyles>;
export type AllExercisesStyles = ReturnType<typeof createAllExercisesStyles>;
export type AddExerciseStyles = ReturnType<typeof createAddExerciseStyles>;
export type ExerciseHistoryStyles = ReturnType<typeof createExerciseHistoryStyles>;
export type SettingsStyles = ReturnType<typeof createSettingsStyles>;
