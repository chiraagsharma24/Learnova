import mongoose, { Schema, type Document } from "mongoose";

export interface ICourse extends Document {
	title: string;
	image: string;
	description: string; // HTML content
	active: boolean;
	visibility: "everyone" | "signed-in";
	access: "open" | "invitation" | "payment";
	/** Public site URL when course is published */
	websiteUrl: string;
	courseAdminUserId: string;
	price: number;
	instructorId: string;
	instructorName: string;
	tags: string[];
	viewCount: number;
	createdAt: Date;
	updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
	{
		title: { type: String, required: true, trim: true },
		image: { type: String, default: "" },
		description: { type: String, default: "" },
		active: { type: Boolean, default: true },
		visibility: {
			type: String,
			enum: ["everyone", "signed-in"],
			default: "everyone",
		},
		access: {
			type: String,
			enum: ["open", "invitation", "payment"],
			default: "open",
		},
		websiteUrl: { type: String, default: "" },
		courseAdminUserId: { type: String, default: "" },
		price: { type: Number, default: 0, min: 0 },
		instructorId: { type: String, required: true },
		instructorName: { type: String, required: true },
		tags: { type: [String], default: [] },
		viewCount: { type: Number, default: 0, min: 0 },
	},
	{ timestamps: true },
);

CourseSchema.index({ title: "text", description: "text" });

export const Course = mongoose.model<ICourse>("Course", CourseSchema);
