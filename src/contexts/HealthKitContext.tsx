import React, { createContext, useContext, useState } from "react";

interface HealthKitContextType {
    isHealthKitAuthorized: boolean;
    setIsHealthKitAuthorized: (value: boolean) => void;
}

const HealthKitContext = createContext<HealthKitContextType | undefined>(undefined);

export const HealthKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isHealthKitAuthorized, setIsHealthKitAuthorized] = useState(false);

    return (
        <HealthKitContext.Provider value={{ isHealthKitAuthorized, setIsHealthKitAuthorized }}>
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
