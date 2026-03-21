import mongoose, { Schema, type Document } from "mongoose";

export type UserRole = "admin" | "instructor" | "learner";
export type BadgeName = string;

export interface IUserArtifact {
	name: string;
	description: string;
	level: number;
	unlockedAt: Date;
}

export interface ILevelPath {
	level: number;
	title: string;
	track: string;
	minXP: number;
	badge: string;
	artifact: string;
}

export const LEVEL_PATHS: ILevelPath[] = [
	{
		level: 1,
		title: "The Novice",
		track: "Fundamentals",
		minXP: 0,
		badge: "Getting Started",
		artifact: "Novice Scroll",
	},
	{
		level: 2,
		title: "The Architect",
		track: "DSA",
		minXP: 500,
		badge: "Logic Crafter",
		artifact: "Architect Compass",
	},
	{
		level: 3,
		title: "The Builder",
		track: "First Project",
		minXP: 1500,
		badge: "Builder's Mark",
		artifact: "Builder Blueprint",
	},
	{
		level: 4,
		title: "The Marketer",
		track: "Resume/LinkedIn",
		minXP: 3000,
		badge: "Profile Polisher",
		artifact: "Spotlight Frame",
	},
	{
		level: 5,
		title: "The Corporate Scout",
		track: "Internship",
		minXP: 5000,
		badge: "Opportunity Hunter",
		artifact: "Scout Telescope",
	},
	{
		level: 6,
		title: "The Gladiator",
		track: "Placement Prep",
		minXP: 8000,
		badge: "Interview Warrior",
		artifact: "Gladiator Shield",
	},
	{
		level: 7,
		title: "The Legend",
		track: "Placement",
		minXP: 12000,
		badge: "Placement Legend",
		artifact: "Legend Crown",
	},
];

/** Fixed XP granted when a non-quiz lesson is marked complete (first time only per lesson). */
export const LESSON_COMPLETION_XP = 25;

export interface IUserProfile extends Document {
	userId: string; // Matches better-auth user id
	email: string;
	name: string;
	role: UserRole;
	totalPoints: number;
	level: number;
	levelName: string;
	streakCount: number;
	longestStreak: number;
	lastActiveDate?: Date;
	badges: BadgeName[];
	artifacts: IUserArtifact[];
	isMentor: boolean;
	maxMenteeSlots: number;
	menteeUserIds: string[];
	myMentorUserId?: string;
	messageCredits: number;
	instructorRequestStatus?: "pending" | "approved" | "rejected";
	/** When true, user cannot use authenticated APIs (admin-managed). */
	blocked: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const BADGE_THRESHOLDS: Record<string, number> = {
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
		role: {
			type: String,
			enum: ["admin", "instructor", "learner"],
			default: "learner",
		},
		totalPoints: { type: Number, default: 0 },
		level: { type: Number, default: 1, min: 1, max: 7 },
		levelName: { type: String, default: "The Novice" },
		streakCount: { type: Number, default: 0 },
		longestStreak: { type: Number, default: 0 },
		lastActiveDate: { type: Date },
		badges: [{ type: String }],
		artifacts: [
			{
				name: { type: String, required: true },
				description: { type: String, required: true },
				level: { type: Number, required: true },
				unlockedAt: { type: Date, default: Date.now },
			},
		],
		isMentor: { type: Boolean, default: false },
		maxMenteeSlots: { type: Number, default: 5, min: 1, max: 10 },
		menteeUserIds: [{ type: String }],
		myMentorUserId: { type: String },
		messageCredits: { type: Number, default: 10 },
		instructorRequestStatus: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: null,
		},
		blocked: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

export function getLevelFromXP(points: number): ILevelPath {
	const normalized = Math.max(0, points || 0);
	for (let i = LEVEL_PATHS.length - 1; i >= 0; i -= 1) {
		if (normalized >= LEVEL_PATHS[i].minXP) {
			return LEVEL_PATHS[i];
		}
	}
	return LEVEL_PATHS[0];
}

// Helper to compute badges from points
export function computeBadges(points: number): BadgeName[] {
	return (Object.entries(BADGE_THRESHOLDS) as [BadgeName, number][])
		.filter(([, threshold]) => points >= threshold)
		.map(([name]) => name);
}

export function computeArtifacts(
	existingArtifacts: IUserArtifact[],
	oldLevel: number,
	newLevel: number,
): IUserArtifact[] {
	const artifacts = [...(existingArtifacts || [])];
	if (newLevel <= oldLevel) return artifacts;

	for (let level = oldLevel + 1; level <= newLevel; level += 1) {
		const levelMeta = LEVEL_PATHS.find((entry) => entry.level === level);
		if (!levelMeta) continue;
		const alreadyUnlocked = artifacts.some((item) => item.level === level);
		if (!alreadyUnlocked) {
			artifacts.push({
				name: levelMeta.artifact,
				description: `Milestone artifact unlocked at Level ${level}: ${levelMeta.title}`,
				level,
				unlockedAt: new Date(),
			});
		}
	}
	return artifacts;
}

export function updateDailyStreak(profile: IUserProfile): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (!profile.lastActiveDate) {
		profile.lastActiveDate = today;
		profile.streakCount = 1;
		profile.longestStreak = Math.max(profile.longestStreak || 0, 1);
		return true;
	}

	const last = new Date(profile.lastActiveDate);
	last.setHours(0, 0, 0, 0);
	const diffInDays = Math.floor(
		(today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffInDays <= 0) return false;

	if (diffInDays === 1) {
		profile.streakCount = (profile.streakCount || 0) + 1;
	} else {
		profile.streakCount = 1;
	}
	profile.longestStreak = Math.max(
		profile.longestStreak || 0,
		profile.streakCount || 0,
	);
	profile.lastActiveDate = today;
	return true;
}

export { BADGE_THRESHOLDS };
export const UserProfile = mongoose.model<IUserProfile>(
	"UserProfile",
	UserProfileSchema,
);
