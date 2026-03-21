import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();

const mongoUri =
	process.env.MONGODB_URI || "mongodb://localhost:27017/learnova";
const client = new MongoClient(mongoUri);
const db = client.db();

let authConfig: ReturnType<typeof betterAuth>;

try {
	authConfig = betterAuth({
		baseURL:
			(process.env.BETTER_AUTH_URL || "http://localhost:1337").replace(
				/\/$/,
				"",
			) + "/api/auth",
		trustedOrigins: (process.env.TRUSTED_ORIGINS || "http://localhost:5173")
			.split(",")
			.map((o) => o.trim()),
		secret:
			process.env.BETTER_AUTH_SECRET ||
			"learnova-secret-key-change-in-prod",
		database: mongodbAdapter(db),
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
		},
		user: {
			additionalFields: {
				role: {
					type: "string",
					required: false,
					defaultValue: "learner",
				},
			},
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 10 * 60,
			},
		},
	});
} catch (err) {
	console.error("Better Auth initialization error:", err);
	throw err;
}

export default authConfig;
