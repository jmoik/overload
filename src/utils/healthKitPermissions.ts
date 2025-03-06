import AppleHealthKit, { HealthKitPermissions } from "react-native-health";

export const healthKitPermissions: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.StepCount,
        ],
        write: [],
    },
};
