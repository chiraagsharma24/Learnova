import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
    title: string;
    image: string;
    description: string; // HTML content
    active: boolean;
    visibility: "everyone" | "signed-in";
    access: "open" | "invitation";
    instructorId: string;
    instructorName: string;
    createdAt: Date;
    updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: true, trim: true },
        image: { type: String, default: "" },
        description: { type: String, default: "" },
        active: { type: Boolean, default: true },
        visibility: { type: String, enum: ["everyone", "signed-in"], default: "everyone" },
        access: { type: String, enum: ["open", "invitation"], default: "open" },
        instructorId: { type: String, required: true },
        instructorName: { type: String, required: true },
    },
    { timestamps: true }
);

CourseSchema.index({ title: "text", description: "text" });

export const Course = mongoose.model<ICourse>("Course", CourseSchema);
