// screens/StatsScreen.tsx
import React, { useMemo } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createStatsStyles } from "../styles/globalStyles";
import { subDays, isAfter } from "date-fns";

const StatsScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createStatsStyles(currentTheme);
    const { exercises, exerciseHistory, trainingInterval } = useExerciseContext();

    const {
        trainingLoadData,
        targetTrainingLoad,
        totalWeeklyLoad,
        totalWeeklySets,
        totalWeeklyEnduranceSets,
    } = useMemo(() => {
        const today = new Date();
        const intervalStart = subDays(today, trainingInterval);

        const loadByDay = Array(trainingInterval).fill(0);

        exercises.forEach((exercise) => {
            const history = exerciseHistory[exercise.id] || [];
            history.forEach((entry) => {
                const entryDate = new Date(entry.date);
                if (isAfter(entryDate, intervalStart)) {
                    const dayIndex =
                        trainingInterval -
                        Math.ceil((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (dayIndex >= 0 && dayIndex < trainingInterval) {
                        loadByDay[dayIndex] += entry.sets * entry.rpe;
                    }
                }
            });
        });

        const totalWeeklyLoad = exercises.reduce(
            (total, exercise) => total + exercise.weeklySets * exercise.targetRPE,
            0
        );
        const targetDailyLoad = totalWeeklyLoad / trainingInterval;

        const totalWeeklySets = exercises.reduce(
            (total, exercise) =>
                exercise.category != "Endurance" ? total + exercise.weeklySets : total,
            0
        );

        const totalWeeklyEnduranceSets = exercises.reduce(
            (total, exercise) =>
                exercise.category == "Endurance" ? total + exercise.weeklySets : total,
            0
        );

        return {
            trainingLoadData: loadByDay.map((load) => Math.max(load, 0)), // Ensure no negative values
            targetTrainingLoad: Math.max(targetDailyLoad, 0), // Ensure no negative values
            totalWeeklyLoad,
            totalWeeklySets,
            totalWeeklyEnduranceSets,
        };
    }, [exercises, exerciseHistory, trainingInterval]);

    const chartData = {
        labels: Array.from(
            { length: trainingInterval },
            (_, i) => `${i == trainingInterval - 1 ? "Today" : -trainingInterval + i + 1}`
        ),
        datasets: [
            {
                data: trainingLoadData,
                color: (opacity = 1) => currentTheme.colors.primary,
                strokeWidth: 2,
            },
            {
                data: Array(trainingInterval).fill(totalWeeklyLoad / trainingInterval),
                color: (opacity = 1) => "rgba(255, 0, 0, 0.8)", // Red color for target line
                strokeWidth: 2,
            },
        ],
        legend: ["Actual Load", "Target Load"],
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Training Load per {trainingInterval} Days</Text>
            {trainingLoadData.some((load) => load > 0) ? (
                <LineChart
                    data={chartData}
                    width={Dimensions.get("window").width - 16}
                    height={220}
                    yAxisLabel=""
                    chartConfig={{
                        backgroundColor: currentTheme.colors.background,
                        backgroundGradientFrom: currentTheme.colors.background,
                        backgroundGradientTo: currentTheme.colors.background,
                        decimalPlaces: 0,
                        color: (opacity = 1) => currentTheme.colors.text,
                        labelColor: (opacity = 1) => currentTheme.colors.text,
                        style: {
                            borderRadius: 16,
                        },
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: currentTheme.colors.primary,
                        },
                    }}
                    bezier
                    style={styles.chart}
                />
            ) : (
                <Text style={styles.noDataText}>
                    No training data available for the current interval
                </Text>
            )}
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>Total Load (Sets x RPE): {totalWeeklyLoad}</Text>
                <Text style={styles.statsText}>Total Sets: {totalWeeklySets}</Text>
                <Text style={styles.statsText}>
                    Total Endurance Workouts: {totalWeeklyEnduranceSets}
                </Text>
                <Text style={styles.statsText}>
                    Target Daily Training Load: {targetTrainingLoad.toFixed(1)}
                </Text>
                <Text style={styles.statsText}>
                    Load Difference:{" "}
                    {(trainingLoadData.reduce((a, b) => a + b, 0) - targetTrainingLoad).toFixed(1)}
                </Text>
            </View>
        </ScrollView>
    );
};

export default StatsScreen;
