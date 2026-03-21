import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
    userId: string;
    courseId: mongoose.Types.ObjectId;
    enrolledAt: Date;
    completedAt?: Date;
    completionPercentage: number;
}

const EnrollmentSchema = new Schema<IEnrollment>(
    {
        userId: { type: String, required: true },
        courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
        enrolledAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    },
    { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
