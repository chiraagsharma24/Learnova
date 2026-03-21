import mongoose, { Schema, type Document } from "mongoose";

export interface IReview extends Document {
	userId: string;
	userName: string;
	courseId: mongoose.Types.ObjectId;
	rating: number; // 1-5
	comment: string;
	approved: boolean;
	createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
	{
		userId: { type: String, required: true },
		userName: { type: String, required: true },
		courseId: {
			type: Schema.Types.ObjectId,
			ref: "Course",
			required: true,
		},
		rating: { type: Number, required: true, min: 1, max: 5 },
		comment: { type: String, required: true },
		approved: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

ReviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
