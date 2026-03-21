import { LessonProgress } from "../models/LessonProgress.js";
import {
	UserProfile,
	computeArtifacts,
	computeBadges,
	getLevelFromXP,
} from "../models/UserProfile.js";

/**
 * totalPoints = sum(lesson/quiz pointsEarned)
 */
export async function recomputeProfileTotals(userId: string): Promise<number> {
	const allUserProgress = await LessonProgress.find({ userId });
	const totalPoints = allUserProgress.reduce(
		(sum, p) => sum + (p.pointsEarned || 0),
		0,
	);

	const profile = await UserProfile.findOne({ userId });

	const oldLevel = profile?.level || 1;
	const levelMeta = getLevelFromXP(totalPoints);

	const badges = Array.from(
		new Set([
			...(profile?.badges || []),
			...computeBadges(totalPoints),
			levelMeta.badge,
		]),
	);
	const artifacts = computeArtifacts(
		profile?.artifacts || [],
		oldLevel,
		levelMeta.level,
	);

	await UserProfile.findOneAndUpdate(
		{ userId },
		{
			totalPoints,
			level: levelMeta.level,
			levelName: levelMeta.title,
			badges,
			artifacts,
		},
		{ returnDocument: "after" },
	);

	return totalPoints;
}
