// screens/DefaultRpeScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useExerciseContext } from "../../contexts/ExerciseContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types/navigation";

type DefaultRpeScreenNavigationProp = StackNavigationProp<RootStackParamList, "DefaultRpe">;

const DefaultRpeScreen = () => {
    const navigation = useNavigation<DefaultRpeScreenNavigationProp>();
    const { meanRpe, setMeanRpe } = useExerciseContext();
    const [selectedRPE, setSelectedRPE] = useState(meanRpe);
    const [isSetup, setIsSetup] = useState(false);

    useEffect(() => {
        checkIfSetup();
    }, []);

    const checkIfSetup = async () => {
        const alreadySetup = await AsyncStorage.getItem("alreadySetup");
        setIsSetup(alreadySetup !== "true");
    };

    const generatePickerItems = () => {
        const items = [];
        for (let i = 1; i <= 10; i++) {
            items.push(<Picker.Item key={i} label={`${i}`} value={i} />);
        }
        return items;
    };

    const handleSave = async () => {
        setMeanRpe(selectedRPE);
        if (isSetup) {
            await AsyncStorage.setItem("alreadySetup", "true");
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Home" as keyof RootStackParamList }],
                })
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Default RPE</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedRPE}
                    onValueChange={(itemValue) => setSelectedRPE(itemValue)}
                    style={styles.picker}
                >
                    {generatePickerItems()}
                </Picker>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{isSetup ? "Get Started" : "Save"}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    pickerContainer: {
        width: "80%",
        height: 200,
        justifyContent: "center",
        overflow: "hidden",
    },
    picker: {
        width: "100%",
    },
    saveButton: {
        marginTop: 20,
        backgroundColor: "#007AFF",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    saveButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default DefaultRpeScreen;
