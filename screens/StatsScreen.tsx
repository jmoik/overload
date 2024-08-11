// screens/StatsScreen.tsx
import React, { useMemo } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useExerciseContext } from "../contexts/ExerciseContext";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme, darkTheme, createStatsStyles } from "../styles/globalStyles";
import { subDays, isAfter } from "date-fns";
import {
    EnduranceExerciseHistoryEntry,
    Exercise,
    ExerciseHistoryEntry,
    MobilityExerciseHistoryEntry,
    StrengthExerciseHistoryEntry,
} from "../contexts/Exercise";
import ViewPager from "@react-native-community/viewpager";

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
                // targetStrengthLoad += exercise.weeklySets * exercise.targetRPE;
                targetStrengthLoad += exercise.weeklySets;
                targetStrengthSets += exercise.weeklySets;
            }

            history.forEach((entry: ExerciseHistoryEntry) => {
                // dayIndex = [-trainingInterval+1, -trainingInterval+2, ..., 0 (today)]
                // dayIndex = [-10+1, -10+2, ..., 0 (today)]
                // dayIndex = [-9, -8, ..., 0 (today)] => 10 days

                const today = new Date();
                const entryDate = new Date(entry.date);
                const daysAgo = Math.floor(
                    (today.getTime() - entryDate.getTime()) / (1000 * 3600 * 24)
                );
                const dayIndex = trainingInterval - daysAgo - 1;

                // console.log("Day Index: ", dayIndex);
                // console.log("Days Ago: ", daysAgo);
                // console.log("Entry name: ", exercise.name);
                // console.log("Entry date: ", new Date(entry.date).getDate());
                // console.log("Today: ", today.getDate());

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
                        // const load = strengthEntry.sets * entry.rpe;
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
                        // const load = (strengthEntry.sets ?? 0) * entry.rpe;
                        const load = strengthEntry.sets ?? 0;
                        strengthLoadByDayForMA[dayIndex] += load;
                    }
                }
            });
        });

        // log
        // console.log("Strength Load By Day: ", strengthLoadByDay);
        // console.log("Endurance Load By Day: ", enduranceLoadByDay);
        // console.log("Mobility Load By Day: ", mobilityLoadByDay);

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
        };
    };

    const stats = calculateStats();

    const createChartData = (loadData: number[], dataForMA: number[], targetLoad: number) => {
        loadData = loadData.map((value) => (isNaN(value) ? 0 : value));
        const movingAverage = calculateMovingAverage(dataForMA, trainingInterval);

        const result = {
            labels: Array.from(
                { length: loadData.length },
                (_, i) => `${i === loadData.length - 1 ? "Today" : -loadData.length + i + 1}`
            ),
            datasets: [
                {
                    data: Array(trainingInterval).fill(targetLoad),
                    color: (opacity = 1) => "rgba(255, 0, 0, 0.8)",
                    strokeWidth: 2,
                    withDots: false,
                },
                {
                    data: loadData,
                    color: (opacity = 1) => currentTheme.colors.primary,
                    strokeWidth: 2,
                    withDots: true,
                },

                {
                    data: movingAverage,
                    color: (opacity = 1) => "rgba(0, 255, 0, 0.8)",
                    strokeWidth: 2,
                    withDots: false,
                },
            ],
            legend: [
                `Target: ${targetLoad.toFixed(1)}`,
                `Today: ${loadData[loadData.length - 1].toFixed(1)}`,
                `MA: ${movingAverage[movingAverage.length - 1].toFixed(1)}`,
            ],
        };
        // console.log("Datasets: ", result.datasets);

        if (
            result.datasets[0].data.some((load: number) => isNaN(load)) ||
            result.datasets[1].data.some((load: number) => isNaN(load)) ||
            result.datasets[2].data.some((load: number) => isNaN(load)) ||
            result.datasets[0].data.length != trainingInterval ||
            result.datasets[2].data.length != trainingInterval
        ) {
            console.log(result.datasets[0].data);
            console.log(result.datasets[1].data);
            console.log(result.datasets[2].data);
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
                        chartConfig={{
                            backgroundColor: currentTheme.colors.background,
                            backgroundGradientFrom: currentTheme.colors.background,
                            backgroundGradientTo: currentTheme.colors.background,
                            decimalPlaces: 1, // Set decimal places to 2 for more precision
                            color: (opacity = 1) => currentTheme.colors.text,
                            labelColor: (opacity = 1) => currentTheme.colors.text,
                            propsForBackgroundLines: {
                                strokeDasharray: "", // Solid gridlines
                                stroke: currentTheme.colors.text, // Ensure gridlines are visible and consistent
                            },
                            propsForDots: {
                                r: "3",
                                strokeWidth: "1",
                                stroke: currentTheme.colors.text,
                            },
                            strokeWidth: 2, // Width of the line
                            useShadowColorFromDataset: false, // Do not use shadow color from dataset
                            propsForLabels: {
                                fontSize: 12,
                                fontWeight: "bold",
                            },
                        }}
                        bezier
                        style={styles.chart}
                        formatYLabel={(value) => parseFloat(value).toFixed(1)} // Ensure y-axis labels are not rounded to integers
                        // verticalLabelRotation={30} // Adjusts rotation of x-axis labels for better readability
                        fromZero={true} // Ensures y-axis starts from zero
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
            {/* <Text style={styles.statLabel}>
                Load: {actualLoad.toFixed(1)} / {targetLoad.toFixed(1)}
                {"\n"}
            </Text> */}
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
            {/* </View> */}
            {/* <View key="2"> */}
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
            {/* </View> */}
            {/* <View key="3"> */}
            {renderChart(
                createChartData(
                    stats.mobilityLoadData,
                    stats.mobilityLoadDataForMA,
                    stats.targetMobilityLoad / trainingInterval
                ),
                "Mobility"
            )}
            {renderMobilityStats(stats.actualMobilitySets, stats.targetMobilitySets, "Mobility")}
            {/* </View> */}
            {/* </ViewPager> */}
        </ScrollView>
    );
};

export default StatsScreen;
