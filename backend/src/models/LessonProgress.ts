import mongoose, { Schema, type Document } from "mongoose";

export interface ILessonProgress extends Document {
	userId: string;
	lessonId: mongoose.Types.ObjectId;
	courseId: mongoose.Types.ObjectId;
	completed: boolean;
	completedAt?: Date;
	// Quiz-specific fields
	quizAttempts: number;
	quizScore?: number; // percentage 0-100
	pointsEarned: number;
}

const LessonProgressSchema = new Schema<ILessonProgress>(
	{
		userId: { type: String, required: true },
		lessonId: {
			type: Schema.Types.ObjectId,
			ref: "Lesson",
			required: true,
		},
		courseId: {
			type: Schema.Types.ObjectId,
			ref: "Course",
			required: true,
		},
		completed: { type: Boolean, default: false },
		completedAt: { type: Date },
		quizAttempts: { type: Number, default: 0 },
		quizScore: { type: Number },
		pointsEarned: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
LessonProgressSchema.index({ userId: 1, courseId: 1 });

export const LessonProgress = mongoose.model<ILessonProgress>(
	"LessonProgress",
	LessonProgressSchema,
);
