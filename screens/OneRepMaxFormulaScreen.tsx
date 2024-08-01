// screens/OneRepMaxFormulaScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useExerciseContext } from "../contexts/ExerciseContext";

const OneRepMaxFormulaScreen = () => {
    const { oneRepMaxFormula, setOneRepMaxFormula } = useExerciseContext();

    const formulas = [
        { name: "Matt Brzycki", value: "brzycki" },
        { name: "Epley", value: "epley" },
        { name: "Lander", value: "lander" },
    ] as const;

    return (
        <View style={styles.container}>
            {formulas.map((formula) => (
                <TouchableOpacity
                    key={formula.value}
                    style={[
                        styles.formulaItem,
                        oneRepMaxFormula === formula.value && styles.selectedFormula,
                    ]}
                    onPress={() => setOneRepMaxFormula(formula.value)}
                >
                    <Text
                        style={[
                            styles.formulaText,
                            oneRepMaxFormula === formula.value && styles.selectedFormulaText,
                        ]}
                    >
                        {formula.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0",
    },
    formulaItem: {
        padding: 15,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    selectedFormula: {
        backgroundColor: "#e6f2ff",
    },
    formulaText: {
        fontSize: 16,
    },
    selectedFormulaText: {
        color: "#007AFF",
    },
});

export default OneRepMaxFormulaScreen;
