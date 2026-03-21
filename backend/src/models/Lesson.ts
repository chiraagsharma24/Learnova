import mongoose, { Schema, Document } from "mongoose";

export type LessonType = "video" | "document" | "image" | "quiz";
export type LessonStatus = "draft" | "published";

export interface ILesson extends Document {
    courseId: mongoose.Types.ObjectId;
    title: string;
    type: LessonType;
    status: LessonStatus;
    order: number;
    // Content by type
    videoUrl?: string;
    documentUrl?: string;
    imageUrl?: string;
    // Quiz handled in Quiz model
    duration?: number; // minutes (for video)
    createdAt: Date;
    updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
        title: { type: String, required: true, trim: true },
        type: { type: String, enum: ["video", "document", "image", "quiz"], required: true },
        status: { type: String, enum: ["draft", "published"], default: "draft" },
        order: { type: Number, default: 0 },
        videoUrl: { type: String },
        documentUrl: { type: String },
        imageUrl: { type: String },
        duration: { type: Number },
    },
    { timestamps: true }
);

LessonSchema.index({ courseId: 1, order: 1 });
LessonSchema.index({ title: "text" });

export const Lesson = mongoose.model<ILesson>("Lesson", LessonSchema);
