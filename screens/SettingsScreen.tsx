// screens/SettingsScreen.tsx
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { RootStackParamList, SettingsScreenNavigationProp } from "../types/navigation";

type SettingItem = {
    id: string;
    title: string;
    screen: keyof RootStackParamList;
};

const settingsOptions: SettingItem[] = [
    { id: "1", title: "One Rep Max Formula", screen: "OneRepMaxFormula" },
    { id: "2", title: "Rest Timer", screen: "RestTimer" },
];

const SettingsScreen = () => {
    const navigation = useNavigation<SettingsScreenNavigationProp>();

    const renderItem = ({ item }: { item: SettingItem }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate(item.screen)}
        >
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Icon name="chevron-forward-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={settingsOptions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0",
    },
    settingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    settingTitle: {
        fontSize: 16,
    },
});

export default SettingsScreen;
