import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AppleHealthKit, { HealthValue } from "react-native-health";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface HealthKitContextType {
    isHealthKitAuthorized: boolean;
    setIsHealthKitAuthorized: (value: boolean) => void;
    getDailySteps: (date: Date) => Promise<number>;
    getStepsForInterval: (
        startDate: Date,
        endDate: Date
    ) => Promise<{ date: string; steps: number }[]>;
}

const HealthKitContext = createContext<HealthKitContextType | undefined>(undefined);

export const HealthKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isHealthKitAuthorized, setIsHealthKitAuthorized] = useState(false);

    useEffect(() => {
        // Check if HealthKit is already authorized
        const checkHealthKitAuth = async () => {
            if (Platform.OS === "ios") {
                try {
                    const authStatus = await AsyncStorage.getItem("healthKitAuthorized");
                    if (authStatus === "true") {
                        setIsHealthKitAuthorized(true);
                    } else {
                        AppleHealthKit.initHealthKit(
                            {
                                permissions: {
                                    read: ["StepCount"],
                                },
                            },
                            (error: string) => {
                                if (error) {
                                    console.error("Error initializing HealthKit:", error);
                                } else {
                                    console.log("HealthKit initialized successfully");
                                    setIsHealthKitAuthorized(true);
                                    AsyncStorage.setItem("healthKitAuthorized", "true");
                                }
                            }
                        );
                    }
                } catch (error) {
                    console.error("Error checking HealthKit auth status:", error);
                }
            }
        };

        checkHealthKitAuth();
    }, []);

    const getDailySteps = async (date: Date): Promise<number> => {
        if (Platform.OS !== "ios" || !isHealthKitAuthorized) {
            return 0;
        }

        const options = {
            date: date.toISOString(),
        };

        try {
            const res = await new Promise<HealthValue>((resolve, reject) => {
                AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(results);
                });
            });

            return Math.round(res.value || 0);
        } catch (error) {
            console.error("Error getting step count:", error);
            return 0;
        }
    };

    const getStepsForInterval = async (
        startDate: Date,
        endDate: Date
    ): Promise<{ date: string; steps: number }[]> => {
        if (Platform.OS !== "ios" || !isHealthKitAuthorized) {
            return [];
        }

        const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            includeManuallyAdded: true,
        };

        try {
            const res = await new Promise<any>((resolve, reject) => {
                AppleHealthKit.getDailyStepCountSamples(options, (err: Object, results: any) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(results);
                });
            });

            // Format the results
            return res.map((item: any) => ({
                date: new Date(item.startDate).toISOString().split("T")[0],
                steps: Math.round(item.value || 0),
            }));
        } catch (error) {
            console.error("Error getting step counts for interval:", error);
            return [];
        }
    };

    return (
        <HealthKitContext.Provider
            value={{
                isHealthKitAuthorized,
                setIsHealthKitAuthorized,
                getDailySteps,
                getStepsForInterval,
            }}
        >
            {children}
        </HealthKitContext.Provider>
    );
};

export const useHealthKit = () => {
    const context = useContext(HealthKitContext);
    if (!context) {
        throw new Error("useHealthKit must be used within a HealthKitProvider");
    }
    return context;
};
