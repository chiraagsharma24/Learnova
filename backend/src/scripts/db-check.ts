import { UserProfile } from "../models/UserProfile.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { connectMongoDB, mongoose } from "../database/mongoose.js";
import dotenv from "dotenv";

dotenv.config();

async function checkDb() {
    try {
        await connectMongoDB();
        console.log("URI:", process.env.MONGODB_URI || "default (localhost)");

        const collections = await mongoose.connection.db!.listCollections().toArray();
        console.log("Collections in DB:", collections.map(c => c.name));

        const courses = await Course.countDocuments();
        const learners = await UserProfile.countDocuments({ role: "learner" });
        const instructors = await UserProfile.countDocuments({ role: "instructor" });
        const admins = await UserProfile.countDocuments({ role: "admin" });
        const enrollments = await Enrollment.countDocuments();

        console.log("Mongoose Model Counts:");
        console.log("- Course:", courses);
        console.log("- UserProfile (learner):", learners);
        console.log("- UserProfile (instructor):", instructors);
        console.log("- UserProfile (admin):", admins);
        console.log("- Enrollment:", enrollments);

        // Raw counts
        const rawUsers = await mongoose.connection.db!.collection("userprofiles").countDocuments();
        const rawCourses = await mongoose.connection.db!.collection("courses").countDocuments();
        const rawEnrollments = await mongoose.connection.db!.collection("enrollments").countDocuments();

        console.log("Raw Collection Counts:");
        console.log("- userprofiles:", rawUsers);
        console.log("- courses:", rawCourses);
        console.log("- enrollments:", rawEnrollments);

        process.exit(0);
    } catch (err) {
        console.error("DB check failed:", err);
        process.exit(1);
    }
}

checkDb();
