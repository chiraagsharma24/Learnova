import { UserProfile } from "../models/UserProfile.js";
import { connectMongoDB } from "../database/mongoose.js";
import dotenv from "dotenv";

dotenv.config();

async function promoteToAdmin(email: string) {
    try {
        await connectMongoDB();

        const profile = await UserProfile.findOneAndUpdate(
            { email },
            { role: "admin" },
            { new: true }
        );

        if (!profile) {
            console.error(`User with email ${email} not found in UserProfile collection.`);
            process.exit(1);
        }

        console.log(`Successfully promoted ${email} to admin!`);
        console.log("Updated Profile:", profile);
        process.exit(0);
    } catch (err) {
        console.error("Error promoting user:", err);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.log("Usage: npx tsx src/scripts/promote-admin.ts <email>");
    process.exit(1);
}

promoteToAdmin(email);
