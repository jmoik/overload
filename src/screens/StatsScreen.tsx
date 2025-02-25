// screens/StatsScreen.tsx
import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createStatsStyles } from "../../styles/globalStyles";
import { subDays } from "date-fns";
import {
    EnduranceExerciseHistoryEntry,
    Exercise,
    ExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../contexts/Exercise";

const calculateMovingAverage = (data: number[], windowSize: number): number[] => {
    let result = data.map((_, index, array) => {
        const start = Math.max(0, index - windowSize + 1);
        const window = array.slice(start, index + 1);
        return window.reduce((sum, value) => sum + value, 0) / window.length;
    });
    result = result.slice(-windowSize);

    // check if the moving average is valid
    if (result.some((load: number) => isNaN(load))) {
        return Array(windowSize).fill(0);
    }
    return result;
};

const ProgressBar = ({ percentage, color, label, actualSets, targetSets }) => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const barWidth = Math.min(percentage, 100); // Cap the visual bar at 100%
    return (
        <View style={{ marginBottom: 10 }}>
            <Text style={{ marginBottom: 5, color: currentTheme.colors.text }}>
                {label} ({Math.round(actualSets)}/{targetSets})
            </Text>
            <View style={{ height: 20, backgroundColor: "#e0e0e0", borderRadius: 10 }}>
                <View
                    style={{
                        width: `${barWidth}%`,
                        height: "100%",
                        backgroundColor: color,
                        borderRadius: 10,
                    }}
                />
            </View>
            <Text style={{ alignSelf: "flex-end", color: currentTheme.colors.text }}>
                {percentage.toFixed(1)}%
            </Text>
        </View>
    );
};

const StatsScreen = () => {
    const { theme } = useTheme();
    const currentTheme = theme === "light" ? lightTheme : darkTheme;
    const styles = createStatsStyles(currentTheme);
    const { exercises, exerciseHistory, trainingInterval } = useExerciseContext();

    const calculateStats = () => {
        const today = new Date();

        let strengthLoadByDay = Array(trainingInterval).fill(0);
        let enduranceLoadByDay = Array(trainingInterval).fill(0);
        let mobilityLoadByDay = Array(trainingInterval).fill(0);

        const intervalStartForMA = subDays(today, trainingInterval * 2);
        const strengthLoadByDayForMA = Array(trainingInterval * 2).fill(0);
        const enduranceLoadByDayForMA = Array(trainingInterval * 2).fill(0);
        const mobilityLoadByDayForMA = Array(trainingInterval * 2).fill(0);

        let targetStrengthLoad = 0;
        let targetEnduranceLoad = 0;
        let targetMobilityLoad = 0;
        let actualStrengthLoad = 0;
        let actualEnduranceLoad = 0;
        let actualMobilityLoad = 0;
        let targetStrengthSets = 0;
        let actualStrengthSets = 0;
        let targetMobilitySets = 0;
        let actualMobilitySets = 0;
        let totalWeeklyEnduranceSets = 0;

        while (strengthLoadByDay.length < trainingInterval) {
            strengthLoadByDay.push(0);
        }
        while (enduranceLoadByDay.length < trainingInterval) {
            enduranceLoadByDay.push(0);
        }
        while (mobilityLoadByDay.length < trainingInterval) {
            mobilityLoadByDay.push(0);
        }

        exercises.forEach((exercise: Exercise) => {
            const history = exerciseHistory[exercise.id] || [];
            const isEndurance = exercise.category === "endurance";
            const isMobility = exercise.category === "mobility";
            const isStrength = exercise.category === "strength";
            const isNsuns = exercise.category === "nsuns";

            if (isEndurance) {
                targetEnduranceLoad += exercise.weeklySets * (exercise.distance ?? 0);
                totalWeeklyEnduranceSets += exercise.weeklySets;
            } else if (isMobility) {
                targetMobilityLoad += exercise.weeklySets;
                targetMobilitySets += exercise.weeklySets;
            } else {
                targetStrengthLoad += exercise.weeklySets;
                targetStrengthSets += exercise.weeklySets;
            }

            history.forEach((entry: ExerciseHistoryEntry) => {
                const today = new Date();
                const entryDate = new Date(entry.date);
                const daysAgo = Math.floor(
                    (today.getTime() - entryDate.getTime()) / (1000 * 3600 * 24)
                );
                const dayIndex = trainingInterval - daysAgo - 1;

                if (dayIndex >= 0 && dayIndex < trainingInterval) {
                    if (isEndurance) {
                        const enduranceEntry = entry as EnduranceExerciseHistoryEntry;
                        const load = enduranceEntry.distance ?? 0;
                        enduranceLoadByDay[dayIndex] += load;
                        actualEnduranceLoad += load;
                    } else if (isMobility) {
                        const mobilityEntry = entry as MobilityExerciseHistoryEntry;
                        const load = mobilityEntry.sets;
                        mobilityLoadByDay[dayIndex] += load;
                        actualMobilityLoad += load;
                        actualMobilitySets += mobilityEntry.sets ?? 0;
                    } else {
                        const strengthEntry = entry as StrengthExerciseHistoryEntry;
                        const load = strengthEntry.sets;
                        strengthLoadByDay[dayIndex] += load;
                        actualStrengthLoad += load;
                        actualStrengthSets += strengthEntry.sets ?? 0;
                    }
                }
            });

            // data to calculate moving average
            history.forEach((entry: ExerciseHistoryEntry) => {
                const today = new Date();
                const entryDate = new Date(entry.date);
                const daysAgo = Math.floor(
                    (today.getTime() - entryDate.getTime()) / (1000 * 3600 * 24)
                );
                const dayIndex = trainingInterval * 2 - daysAgo - 1;
                if (dayIndex >= 0 && dayIndex < trainingInterval * 2) {
                    if (isEndurance) {
                        const enduranceEntry = entry as EnduranceExerciseHistoryEntry;
                        const load = enduranceEntry.distance ?? 0;
                        enduranceLoadByDayForMA[dayIndex] += load;
                    } else if (isMobility) {
                        const mobilityEntry = entry as MobilityExerciseHistoryEntry;
                        const load = mobilityEntry.sets ?? 0;
                        mobilityLoadByDayForMA[dayIndex] += load;
                    } else {
                        const strengthEntry = entry as StrengthExerciseHistoryEntry;
                        const load = strengthEntry.sets ?? 0;
                        strengthLoadByDayForMA[dayIndex] += load;
                    }
                }
            });
        });

        const strengthPercentage = (actualStrengthSets / targetStrengthSets) * 100;
        const endurancePercentage = (actualEnduranceLoad / targetEnduranceLoad) * 100;
        const mobilityPercentage = (actualMobilitySets / targetMobilitySets) * 100;
        const totalScoreAverage = Math.min(
            100,
            Math.round((strengthPercentage + endurancePercentage + mobilityPercentage) / 3)
        );

        return {
            strengthLoadData: strengthLoadByDay.map((load) => Math.max(load, 0)),
            enduranceLoadData: enduranceLoadByDay.map((load) => Math.max(load, 0)),
            mobilityLoadData: mobilityLoadByDay.map((load) => Math.max(load, 0)),
            strengthLoadDataForMA: strengthLoadByDayForMA.map((load) => Math.max(load, 0)),
            enduranceLoadDataForMA: enduranceLoadByDayForMA.map((load) => Math.max(load, 0)),
            mobilityLoadDataForMA: mobilityLoadByDayForMA.map((load) => Math.max(load, 0)),
            targetStrengthLoad: Math.max(targetStrengthLoad, 0),
            targetEnduranceLoad: Math.max(targetEnduranceLoad, 0),
            targetMobilityLoad: Math.max(targetMobilityLoad, 0),
            actualStrengthLoad,
            actualEnduranceLoad,
            actualMobilityLoad,
            targetStrengthSets,
            actualStrengthSets,
            targetMobilitySets,
            actualMobilitySets,
            totalWeeklyEnduranceSets,
            strengthPercentage,
            endurancePercentage,
            mobilityPercentage,
            totalScoreAverage,
        };
    };

    const stats = calculateStats();

    const createChartData = (loadData: number[], dataForMA: number[], targetLoad: number) => {
        loadData = loadData.map((value) => (isNaN(value) ? 0 : value));
        const movingAverage = calculateMovingAverage(dataForMA, trainingInterval);

        // Normalize data to percentages
        const normalizedLoadData = loadData.map((load) => (load / targetLoad) * 100);
        const normalizedMovingAverage = movingAverage.map((load) => (load / targetLoad) * 100);

        const result = {
            labels: Array.from(
                { length: loadData.length },
                (_, i) => `${i === loadData.length - 1 ? "Today" : -loadData.length + i + 1}`
            ),
            datasets: [
                {
                    data: normalizedLoadData,
                    color: (opacity = 1) => currentTheme.colors.primary,
                    strokeWidth: 2,
                    withDots: true,
                },
                {
                    data: normalizedMovingAverage,
                    color: (opacity = 1) => "rgba(0, 255, 0, 0.8)",
                    strokeWidth: 2,
                    withDots: false,
                },
                {
                    data: Array(trainingInterval).fill(100),
                    color: (opacity = 1) => "rgba(255, 0, 0, 0.8)",
                    strokeWidth: 2,
                    withDots: false,
                },
            ],
            legend: [
                `Daily: ${normalizedLoadData[normalizedLoadData.length - 1].toFixed(1)}%`,
                `MA: ${normalizedMovingAverage[normalizedMovingAverage.length - 1].toFixed(1)}%`,
            ],
        };

        if (
            result.datasets[0].data.some((load: number) => isNaN(load)) ||
            result.datasets[1].data.some((load: number) => isNaN(load)) ||
            result.datasets[2].data.some((load: number) => isNaN(load)) ||
            result.datasets[0].data.length != trainingInterval ||
            result.datasets[2].data.length != trainingInterval
        ) {
            console.log("Invalid data for chart");
        }
        return result;
    };

    const renderChart = (chartData: any, title: string) => {
        const screenWidth = Dimensions.get("window").width;

        if (!chartData) {
            return null;
        }

        return (
            <View>
                <Text style={styles.title}>{title}</Text>
                {chartData.datasets[0].data.some((load: number) => load > 0) ? (
                    <LineChart
                        data={chartData}
                        width={screenWidth - 16}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix="%"
                        chartConfig={{
                            backgroundColor: currentTheme.colors.background,
                            backgroundGradientFrom: currentTheme.colors.background,
                            backgroundGradientTo: currentTheme.colors.background,
                            decimalPlaces: 1,
                            color: (opacity = 1) => currentTheme.colors.text,
                            labelColor: (opacity = 1) => currentTheme.colors.text,
                            propsForBackgroundLines: {
                                strokeDasharray: "",
                                stroke: currentTheme.colors.text,
                            },
                            propsForDots: {
                                r: "3",
                                strokeWidth: "1",
                                stroke: currentTheme.colors.text,
                            },
                            strokeWidth: 2,
                            useShadowColorFromDataset: false,
                            propsForLabels: {
                                fontSize: 12,
                                fontWeight: "bold",
                            },
                        }}
                        bezier
                        style={styles.chart}
                        formatYLabel={(value) => parseFloat(value).toFixed(0)}
                        fromZero={true}
                        yAxisInterval={25} // This will show 0%, 25%, 50%, 75%, 100% on the y-axis
                    />
                ) : (
                    <Text style={styles.noDataText}>
                        No {title.toLowerCase()} training data available for the current interval
                    </Text>
                )}
            </View>
        );
    };

    const renderStrengthStats = (
        actualLoad: number,
        targetLoad: number,
        actualSets: number,
        targetSets: number,
        title: string
    ) => (
        <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>{title} Interval Statistics</Text>
            <Text style={styles.statLabel}>
                Sets: {actualSets} / {targetSets}
            </Text>
        </View>
    );

    const renderEnduranceStats = (actualLoad: number, targetLoad: number, title: string) => (
        <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>{title} Interval Statistics</Text>
            <Text style={styles.statLabel}>
                Interval Distance (km): {actualLoad.toFixed(1)} / {targetLoad.toFixed(1)}
                {"\n"}
            </Text>
            <Text style={styles.statLabel}>
                Weekly Distance (km):{" "}
                {((parseFloat(actualLoad.toFixed(1)) / trainingInterval) * 7).toFixed(1)} /{" "}
                {((parseFloat(targetLoad.toFixed(1)) / trainingInterval) * 7).toFixed(1)}
                {"\n"}
            </Text>
            <Text style={styles.statLabel}>
                Monthly Distance (km):{" "}
                {((parseFloat(actualLoad.toFixed(1)) / trainingInterval) * 30).toFixed(1)} /{" "}
                {((parseFloat(targetLoad.toFixed(1)) / trainingInterval) * 30).toFixed(1)}
                {"\n"}
            </Text>
        </View>
    );

    const renderMobilityStats = (actualSets: number, targetSets: number, title: string) => (
        <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>{title} Interval Statistics</Text>
            <Text style={styles.statLabel}>
                Sets: {actualSets} / {targetSets}
            </Text>
        </View>
    );

    const renderSeparator = () => <View style={styles.separator} />;

    return (
        <ScrollView style={styles.container}>
            <View style={{ padding: 16 }}>
                {/* Total Score Display */}
                <View
                    style={{
                        alignItems: "center",
                        marginBottom: 20,
                        backgroundColor: currentTheme.colors.card,
                        padding: 15,
                        borderRadius: 10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 18,
                            color: currentTheme.colors.text,
                            marginBottom: 5,
                            fontWeight: "bold",
                        }}
                    >
                        TRAINING LOAD
                    </Text>
                    <Text
                        style={{
                            fontSize: 48,
                            fontWeight: "bold",
                            color:
                                stats.totalScoreAverage >= 85
                                    ? "#4CAF50"
                                    : stats.totalScoreAverage >= 70
                                    ? "#FFC107"
                                    : "#F44336",
                        }}
                    >
                        {stats.totalScoreAverage}
                    </Text>
                </View>

                <ProgressBar
                    percentage={stats.strengthPercentage}
                    color="#FF6B6B"
                    label="Strength"
                    actualSets={stats.actualStrengthLoad}
                    targetSets={stats.targetStrengthLoad}
                />
                <ProgressBar
                    percentage={stats.endurancePercentage}
                    color="#4ECDC4"
                    label="Endurance"
                    actualSets={stats.actualEnduranceLoad}
                    targetSets={stats.targetEnduranceLoad}
                />
                <ProgressBar
                    percentage={stats.mobilityPercentage}
                    color="#45B7D1"
                    label="Mobility"
                    actualSets={stats.actualMobilityLoad}
                    targetSets={stats.targetMobilityLoad}
                />
            </View>

            {renderChart(
                createChartData(
                    stats.strengthLoadData,
                    stats.strengthLoadDataForMA,
                    stats.targetStrengthLoad / trainingInterval
                ),
                "Strength"
            )}
            {renderStrengthStats(
                stats.actualStrengthLoad,
                stats.targetStrengthLoad,
                stats.actualStrengthSets,
                stats.targetStrengthSets,
                "Strength"
            )}

            {renderSeparator()}

            {renderChart(
                createChartData(
                    stats.enduranceLoadData,
                    stats.enduranceLoadDataForMA,
                    stats.targetEnduranceLoad / trainingInterval
                ),
                "Endurance"
            )}
            {renderEnduranceStats(
                stats.actualEnduranceLoad,
                stats.targetEnduranceLoad,
                "Endurance"
            )}

            {renderSeparator()}

            {renderChart(
                createChartData(
                    stats.mobilityLoadData,
                    stats.mobilityLoadDataForMA,
                    stats.targetMobilityLoad / trainingInterval
                ),
                "Mobility"
            )}
            {renderMobilityStats(stats.actualMobilitySets, stats.targetMobilitySets, "Mobility")}
        </ScrollView>
    );
};

export default StatsScreen;
