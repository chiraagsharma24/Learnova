import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "instructor" | "learner";
export type BadgeName = "Explorer" | "Achiever" | "Specialist" | "Expert" | "Master";

export interface IUserProfile extends Document {
    userId: string; // Matches better-auth user id
    email: string;
    name: string;
    role: UserRole;
    totalPoints: number;
    badges: BadgeName[];
    createdAt: Date;
    updatedAt: Date;
}

const BADGE_THRESHOLDS: Record<BadgeName, number> = {
    Explorer: 40,
    Achiever: 60,
    Specialist: 80,
    Expert: 100,
    Master: 120,
};

const UserProfileSchema = new Schema<IUserProfile>(
    {
        userId: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, enum: ["admin", "instructor", "learner"], default: "learner" },
        totalPoints: { type: Number, default: 0 },
        badges: [{ type: String }],
    },
    { timestamps: true }
);

// Helper to compute badges from points
export function computeBadges(points: number): BadgeName[] {
    return (Object.entries(BADGE_THRESHOLDS) as [BadgeName, number][])
        .filter(([, threshold]) => points >= threshold)
        .map(([name]) => name);
}

export { BADGE_THRESHOLDS };
export const UserProfile = mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);
