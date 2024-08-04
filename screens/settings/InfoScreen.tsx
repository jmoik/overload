// screens/AppInfoScreen.tsx
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../../styles/globalStyles";

const InfoScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;

    return (
        <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>About This App</Text>

            <Text style={[styles.subtitle, { color: currentTheme.colors.text }]}>
                A New Approach to Training
            </Text>
            <Text style={[styles.text, { color: currentTheme.colors.text }]}>
                This app introduces a unique concept in workout planning. Unlike traditional apps
                that create fixed routines for specific days of the week, our approach is more
                flexible and responsive to your training needs. Here's how it works: 1. Instead of
                preset routines, you create a list of exercises you want to incorporate into your
                training. 2. For each exercise, you set a target weekly volume (sets x reps x
                weight). 3. As you log your workouts, the app tracks the volume you've completed for
                each exercise. 4. Based on the outstanding volume (target volume minus completed
                volume), the app helps you determine which exercises you should prioritize in your
                next workout. This method allows for a more dynamic and adaptable training plan,
                ensuring you're always working on the exercises that need the most attention, rather
                than being confined to a rigid weekly schedule.
            </Text>

            <Text style={[styles.subtitle, { color: currentTheme.colors.text }]}>
                How to Use the App
            </Text>
            <Text style={[styles.text, { color: currentTheme.colors.text }]}>
                1. Add Exercises: Start by adding exercises to your list. For each exercise, set
                your target weekly volume. 2. Log Workouts: After each training session, log your
                completed sets, reps, weight, and RPE (Rate of Perceived Exertion) for each
                exercise. 3. Check Outstanding Volume: Before your next workout, check the main
                screen to see which exercises have the highest outstanding volume. These are the
                ones you should prioritize. 4. Track Progress: View your progress over time with the
                1RM Evolution chart for each exercise. 5. Adjust as Needed: Regularly review and
                adjust your target volumes based on your progress and goals. 6. Customize Settings:
                Fine-tune your experience by adjusting the training interval, default RPE, and other
                settings in the Settings menu. 7. Export/Import Data: You can export your data for
                backup or import it into the app using the Settings menu. Remember, this approach
                requires more active engagement in planning your workouts, but it offers greater
                flexibility and responsiveness to your training needs. Listen to your body, and
                don't hesitate to adjust your targets as you progress. Happy training!
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    },
});

export default InfoScreen;
