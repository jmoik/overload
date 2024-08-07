// styles/globalStyles.ts

import { Dimensions, Platform, StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";
import { Icon } from "react-native-elements/dist/icons/Icon";

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
        error: "#FF3B30",
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
        placeholder: "#AAAAAA",
        elevation: {
            1: "#1E1E1E",
            2: "#222222",
            3: "#242424",
            4: "#272727",
            5: "#2C2C2C",
        },
        error: "#FF3B30",
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
export const createGlobalStyles = (theme: typeof lightTheme | typeof darkTheme) =>
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
        icon: {
            fontSize: 24,
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
            backgroundColor: "white",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#ccc",
            flexDirection: "row",
            justifyContent: "space-between",
        },
        exerciseItemLeft: {
            flex: 1,
        },
        exerciseItemRight: {
            justifyContent: "center",
            alignItems: "flex-end",
        },
        exerciseName: {
            fontSize: 20,
            fontWeight: "bold",
            color: theme.colors.text,
        },
        exerciseDescription: {
            fontSize: 14,
            color: theme.colors.text,
            marginTop: 5,
        },
        exerciseSetsPerWeek: {
            fontSize: 14,
            color: theme.colors.text,
            marginTop: 5,
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
            fontSize: 16,
        },
        headerButtons: { flexDirection: "row", alignItems: "center" },
        headerButton: { marginLeft: 20, marginRight: 20 },
    });

// AddExerciseScreen specific styles
const createAddExerciseScreenStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: theme.colors.background,
            // paddingBottom: 20,
            // marginBottom: 20,
        },
        deleteAction: {
            backgroundColor: theme.colors.error,
            justifyContent: "center",
            alignItems: "center",
            width: 80,
            height: "100%",
        },
        scrollViewContent: { flexGrow: 1 },
        container: { paddingHorizontal: 16, paddingTop: 20 },
        buttonContainer: {
            padding: 16,
            backgroundColor: theme.colors.background,
            // marginBottom: 20,
            paddingBottom: 100,
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
        pickerContainer: {
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 5,
            marginTop: 0,
            marginBottom: 10,
            height: 40,
            justifyContent: "center",
            overflow: "hidden",
            width: "100%",
            color: theme.colors.text,
            backgroundColor: "transparent",
        },
        picker: {
            height: 40,
            width: "50%",
            color: theme.colors.text,
            marginBottom: 175,
            marginLeft: "30%",
            backgroundColor: "transparent",
        },
        pickerItem: { fontSize: 14 },
        placeholderText: {
            position: "absolute",
            left: 10,
            color: theme.colors.placeholder,
            fontSize: 14,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "bold",
            marginTop: 10,
            marginBottom: 5,
            color: theme.colors.text,
        },
        setContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
        },
        setInput: {
            flex: 1,
            height: 40,
            borderColor: theme.colors.border,
            borderWidth: 1,
            marginRight: 10,
            paddingHorizontal: 10,
            color: theme.colors.text,
        },
    });

// ExerciseHistoryScreen specific styles
const createExerciseHistoryScreenStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 15,
        },
        inputRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
        },
        smallInput: {
            flex: 1,
            marginRight: 5,
        },
        notesInput: {
            flex: 1,
        },
        dateButton: {
            backgroundColor: theme.colors.card,
            padding: 10,
            borderRadius: 5,
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
        },
        dateButtonText: {
            color: theme.colors.text,
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
            marginRight: 20,
            marginBottom: 20,
        },
        sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
        historyGroup: { marginBottom: 20 },
        historyGroupDate: {
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            color: theme.colors.text,
        },
        notes: { fontSize: 12, marginTop: 4 },
        dateHeader: {
            fontSize: 16,
            fontWeight: "bold",
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            padding: 10,
            marginTop: 10,
        },
        setItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#ccc",
        },
        setText: {
            fontSize: 16,
        },
    });

// ExerciseHistoryScreen specific styles
const createNsunsExerciseHistoryScreen = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        inputContainer: {
            flexDirection: "row",
            marginBottom: 20,
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
        headerButtons: {
            flexDirection: "row",
            alignItems: "center",
        },
        fillButton: {
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
        historyGroup: { marginBottom: 20 },
        historyGroupDate: {
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            color: theme.colors.text,
        },
        notesInput: { height: 40, textAlignVertical: "top" },
        notes: { fontSize: 12, marginTop: 4 },
        dateHeader: {
            fontSize: 16,
            fontWeight: "bold",
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            padding: 10,
            marginTop: 10,
        },
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        separator: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 16,
        },
        setItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            // borderRadius: 10,
            marginBottom: 4,
            height: 60, // Set a fixed height
        },
        setText: {
            fontSize: 18,
            fontWeight: "500",
            color: theme.colors.text,
            flex: 1, // Allow text to take up available space
            paddingBottom: 24,
        },
        iconContainer: {
            width: 24,
            height: 24,
            justifyContent: "center",
            alignItems: "center",
        },
        placeholderIcon: {
            width: 24,
            height: 24,
        },
        percentText: { fontSize: 14, color: "#999999", marginTop: 0 },

        modalContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        modalContent: {
            backgroundColor: theme.colors.background,
            padding: 20,
            borderRadius: 10,
            width: "80%",
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 15,
            color: theme.colors.text,
        },

        saveButton: {
            backgroundColor: theme.colors.primary,
            padding: 10,
            borderRadius: 5,
            alignItems: "center",
            marginBottom: 10,
        },
        saveButtonText: {
            color: "#fff",
            fontWeight: "bold",
        },
        cancelButton: {
            padding: 10,
            borderRadius: 5,
            alignItems: "center",
        },
        cancelButtonText: {
            color: theme.colors.text,
        },
        editContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        input: {
            borderBottomWidth: 1,
            borderColor: theme.colors.primary,
            padding: 4,
            fontSize: 18,
            color: theme.colors.text,
            minWidth: 60,
        },
        unitText: {
            fontSize: 18,
            color: theme.colors.text,
            marginLeft: 4,
        },
        oneRepMaxContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        oneRepMaxLabel: {
            fontSize: 18,
            color: theme.colors.text,
            fontWeight: "bold",
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            color: theme.colors.text,
        },
        oneRepMaxValue: {
            fontSize: 18,
            color: theme.colors.primary,
            fontWeight: "bold",
            // minWidth: 35,
            textAlign: "right",
        },
        oneRepMaxInput: {
            fontSize: 18,
            color: theme.colors.primary,
            fontWeight: "bold",
            borderBottomWidth: 1,
            borderColor: theme.colors.primary,
            padding: 0,
            minWidth: 50,
            textAlign: "right",
        },
        sectionHeader: {
            backgroundColor: theme.colors.background,
            padding: 16,
            paddingTop: 100,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        sectionHeaderText: { fontSize: 18, fontWeight: "bold" },
        historyItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        listContainer: { paddingBottom: 20 },
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

// WelcomeScreen specific styles
const createWelcomeStylesScreenStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        header: {
            height: 60,
            justifyContent: "center",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "#ccc",
        },
        headerText: {
            fontSize: 20,
            fontWeight: "bold",
        },
        contentContainer: {
            flexGrow: 1,
            padding: 20,
            alignItems: "center",
            justifyContent: "center",
        },
        title: {
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 20,
            textAlign: "center",
        },
        subtitle: {
            fontSize: 18,
            marginBottom: 30,
            textAlign: "center",
        },
        option: {
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 2,
            borderRadius: 10,
            padding: 15,
            marginBottom: 20,
            width: "80%",
        },
        selectedOption: {
            backgroundColor: "rgba(0, 122, 255, 0.1)",
        },
        optionText: {
            fontSize: 18,
            fontWeight: "500",
        },
        button: {
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 30,
            width: "80%",
        },
        buttonText: {
            fontSize: 18,
            fontWeight: "bold",
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

export const createWelcomeStyles = (theme: typeof lightTheme | typeof darkTheme) => ({
    ...createGlobalStyles(theme),
    ...createWelcomeStylesScreenStyles(theme),
});

export const createNsunsExerciseHistoryStyles = (theme: typeof lightTheme | typeof darkTheme) => ({
    ...createGlobalStyles(theme),
    ...createNsunsExerciseHistoryScreen(theme),
});

export type GlobalStyles = ReturnType<typeof createGlobalStyles>;
export type AllExercisesStyles = ReturnType<typeof createAllExercisesStyles>;
export type AddExerciseStyles = ReturnType<typeof createAddExerciseStyles>;
export type ExerciseHistoryStyles = ReturnType<typeof createExerciseHistoryStyles>;
export type SettingsStyles = ReturnType<typeof createSettingsStyles>;
export type WelcomStyles = ReturnType<typeof createWelcomeStyles>;

export const createStatsStyles = (theme: typeof lightTheme | typeof darkTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: 16,
        },
        title: {
            fontSize: 28,
            fontWeight: "bold",
            color: theme.colors.text,
            marginBottom: 24,
            textAlign: "center",
        },
        chart: {
            borderRadius: 16,
            marginLeft: -40,
            width: Dimensions.get("window").width,
            marginBottom: 24,
            paddingHorizontal: 16,
        },
        statsContainer: {
            marginTop: 16,
            marginBottom: 32,
            padding: 20,
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        statsText: {
            fontSize: 16,
            color: theme.colors.text,
            marginBottom: 12,
            lineHeight: 22,
        },
        noDataText: {
            fontSize: 16,
            color: theme.colors.text,
            textAlign: "center",
            marginTop: 24,
            marginBottom: 24,
            fontStyle: "italic",
        },
        statsTitle: {
            fontSize: 22,
            fontWeight: "bold",
            color: theme.colors.primary,
            marginBottom: 16,
        },
        subtitle: {
            fontSize: 18,
            color: theme.colors.text,
            marginBottom: 12,
            fontWeight: "500",
        },
        separator: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 16,
        },
        viewPager: { flex: 1 },
        statRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5,
        },
        statLabel: {
            flex: 1,
            fontSize: 20,
            // marginHorizontal: 10,
        },
        statValue: {
            flex: 1,
            fontSize: 16,
            textAlign: "center",
        },
    });
