// screens/StatsScreen.tsx
import React, { useMemo } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createStatsStyles } from "../styles/globalStyles";
import { subDays, isAfter } from "date-fns";
import { Exercise, ExerciseHistoryEntry } from "../models/Exercise";

const StatsScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createStatsStyles(currentTheme);
    const { exercises, exerciseHistory, trainingInterval } = useExerciseContext();

    const {
        strengthLoadData,
        enduranceLoadData,
        targetStrengthLoad,
        targetEnduranceLoad,
        actualStrengthLoad,
        actualEnduranceLoad,
        actualStrengthSets,
        targetStrengthSets,
    } = useMemo(() => {
        const today = new Date();
        const intervalStart = subDays(today, trainingInterval);

        const strengthLoadByDay = Array(trainingInterval).fill(0);
        const enduranceLoadByDay = Array(trainingInterval).fill(0);

        let targetStrengthLoad = 0;
        let targetEnduranceLoad = 0;
        let actualStrengthLoad = 0;
        let actualEnduranceLoad = 0;
        let targetStrengthSets = 0;
        let actualStrengthSets = 0;
        let totalWeeklyEnduranceSets = 0;

        exercises.forEach((exercise: Exercise) => {
            const history = exerciseHistory[exercise.id] || [];
            const isEndurance = exercise.category === "endurance";

            if (isEndurance) {
                targetEnduranceLoad += exercise.weeklySets * (exercise.distance ?? 0);
                totalWeeklyEnduranceSets += exercise.weeklySets;
            } else {
                targetStrengthLoad += exercise.weeklySets * exercise.targetRPE;
                targetStrengthSets += exercise.weeklySets;
            }

            history.forEach((entry: ExerciseHistoryEntry) => {
                const entryDate = new Date(entry.date);
                if (isAfter(entryDate, intervalStart)) {
                    const dayIndex =
                        trainingInterval -
                        Math.ceil((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (dayIndex >= 0 && dayIndex < trainingInterval) {
                        if (isEndurance) {
                            const load = entry.distance ?? 0;
                            enduranceLoadByDay[dayIndex] += load;
                            actualEnduranceLoad += load;
                        } else {
                            const load = (entry.sets ?? 0) * entry.rpe;
                            strengthLoadByDay[dayIndex] += load;
                            actualStrengthLoad += load;
                            actualStrengthSets += entry.sets ?? 0;
                        }
                    }
                }
            });
        });

        return {
            strengthLoadData: strengthLoadByDay.map((load) => Math.max(load, 0)),
            enduranceLoadData: enduranceLoadByDay.map((load) => Math.max(load, 0)),
            targetStrengthLoad: Math.max(targetStrengthLoad, 0),
            targetEnduranceLoad: Math.max(targetEnduranceLoad, 0),
            actualStrengthLoad,
            actualEnduranceLoad,
            targetStrengthSets,
            actualStrengthSets: actualStrengthSets,
            totalWeeklyEnduranceSets,
        };
    }, [exercises, exerciseHistory, trainingInterval]);

    const createChartData = (loadData: number[], targetLoad: number, title: string) => ({
        labels: Array.from(
            { length: trainingInterval },
            (_, i) => `${i === trainingInterval - 1 ? "Today" : -trainingInterval + i + 1}`
        ),
        datasets: [
            {
                data: loadData,
                color: (opacity = 1) => currentTheme.colors.primary,
                strokeWidth: 2,
            },
            {
                data: Array(trainingInterval).fill(targetLoad),
                color: (opacity = 1) => "rgba(255, 0, 0, 0.8)",
                strokeWidth: 2,
            },
        ],
        legend: [`Actual Load`, `Target Load`],
    });

    const renderChart = (chartData: any, title: string) => (
        <>
            <Text style={styles.title}>{title}</Text>
            {chartData.datasets[0].data.some((load: number) => load > 0) ? (
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
                            r: "4",
                            strokeWidth: "2",
                            stroke: currentTheme.colors.primary,
                        },
                    }}
                    bezier
                    style={styles.chart}
                />
            ) : (
                <Text style={styles.noDataText}>
                    No {title.toLowerCase()} training data available for the current interval
                </Text>
            )}
        </>
    );

    const renderStrengthStats = (
        actualLoad: number,
        targetLoad: number,
        actualSets: number,
        totalSets: number,
        title: string
    ) => (
        <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>{title} Stats for this Interval</Text>
            <Text style={styles.statsText}>Target Load (Sets x RPE): {targetLoad.toFixed(1)}</Text>
            <Text style={styles.statsText}>Actual Load: {actualLoad.toFixed(1)}</Text>
            <Text style={styles.statsText}>Target Sets: {totalSets}</Text>
            <Text style={styles.statsText}>Actual Sets: {actualSets}</Text>
        </View>
    );

    const renderEnduranceStats = (
        totalWeeklyLoad: number,
        targetWeeklyLoad: number,
        title: string
    ) => (
        <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>{title} Stats for this Interval</Text>
            <Text style={styles.statsText}>Target Distance: {targetWeeklyLoad.toFixed(1)}</Text>
            <Text style={styles.statsText}>Actual Distance: {totalWeeklyLoad.toFixed(1)}</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Training Statistics</Text>
            {renderChart(
                createChartData(
                    strengthLoadData,
                    targetStrengthLoad / trainingInterval,
                    "Strength"
                ),
                "Strength"
            )}
            {renderStrengthStats(
                actualStrengthLoad,
                targetStrengthLoad,
                actualStrengthSets,
                targetStrengthSets,
                "Strength"
            )}
            {renderChart(
                createChartData(
                    enduranceLoadData,
                    targetEnduranceLoad / trainingInterval,
                    "Endurance"
                ),
                "Endurance"
            )}
            {renderEnduranceStats(actualEnduranceLoad, targetEnduranceLoad, "Endurance")}
        </ScrollView>
    );
};

export default StatsScreen;
