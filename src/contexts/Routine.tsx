// types/Routine.ts
export interface Routine {
    id: string;
    name: string;
    description?: string;
    exercises: string[]; // Array of exercise IDs
    createdAt: Date;
}
