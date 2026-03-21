import type { NextFunction, Request, Response } from "express";
import authConfig from "../auth/index.js";
import { failure } from "../config/response.js";
import type { IUserProfile } from "../models/UserProfile.js";
import { UserProfile } from "../models/UserProfile.js";

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve profile by auth user id, or by email if userId was wrong/out of sync (common after manual DB edits).
 * Repairs `userId` on the profile when matched by email so future lookups work.
 */
export async function loadUserProfileForSession(
	userId: string,
	email: string | undefined,
): Promise<IUserProfile | null> {
	let profile = await UserProfile.findOne({ userId });
	if (!profile && email?.trim()) {
		const em = email.trim();
		profile = await UserProfile.findOne({
			email: { $regex: new RegExp(`^${escapeRegExp(em)}$`, "i") },
		}).sort({ updatedAt: -1 });
		if (profile && profile.userId !== userId) {
			profile.userId = userId;
			await profile.save();
		}
	}
	return profile;
}

export interface AuthRequest extends Request {
	user?: {
		id: string;
		email: string;
		name: string;
		role: string;
	};
}

export async function requireAuth(
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (typeof value === "string") headers.append(key, value);
			else if (Array.isArray(value))
				value.forEach((v) => headers.append(key, v));
		}

		const session = await authConfig.api.getSession({ headers });
		if (!session?.user || !session.session) {
			return failure(res, 401, "Unauthorized");
		}

		const sessionRole =
			(session.user as { role?: string }).role?.trim() || "learner";

		let profile = await loadUserProfileForSession(
			session.user.id,
			session.user.email,
		);

		// New sign-ups: no profile yet — use role from Better Auth (e.g. instructor at register).
		if (!profile) {
			req.user = {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
				role: sessionRole,
			};
			return next();
		}

		// Repair legacy rows: profile stuck as learner but auth user was registered as instructor/admin.
		if (
			profile.role === "learner" &&
			(sessionRole === "instructor" || sessionRole === "admin")
		) {
			profile.role = sessionRole as "instructor" | "admin";
			await profile.save();
		}

		if (profile.blocked) {
			return failure(res, 403, "Account disabled");
		}

		req.user = {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name,
			role: profile.role,
		};
		return next();
	} catch (err) {
		return failure(res, 500, `${err}`);
	}
}

export function requireRole(...roles: string[]) {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		if (!req.user) return failure(res, 401, "Unauthorized");
		if (!roles.includes(req.user.role))
			return failure(res, 403, "Forbidden");
		return next();
	};
}
