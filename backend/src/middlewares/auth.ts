import type { Request, Response, NextFunction } from "express";
import authConfig from "../auth/index.js";
import { failure } from "../config/response.js";
import { UserProfile } from "../models/UserProfile.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.append(key, value);
      else if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    }

    const session = await authConfig.api.getSession({ headers });
    if (!session?.user || !session.session) {
      return failure(res, 401, "Unauthorized");
    }

    // Get role from UserProfile
    const profile = await UserProfile.findOne({ userId: session.user.id });
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: profile?.role || "learner",
    };
    return next();
  } catch (err) {
    return failure(res, 500, `${err}`);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return failure(res, 401, "Unauthorized");
    if (!roles.includes(req.user.role)) return failure(res, 403, "Forbidden");
    return next();
  };
}
