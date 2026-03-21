import mongoose, { Schema, type Document } from "mongoose";

export interface IMessage extends Document {
	fromUserId: string;
	toUserId: string;
	body: string;
	createdAt: Date;
	/** When the recipient has read this message (recipient-only) */
	readAt?: Date | null;
}

const MessageSchema = new Schema<IMessage>(
	{
		fromUserId: { type: String, required: true, index: true },
		toUserId: { type: String, required: true, index: true },
		body: { type: String, required: true, maxlength: 2000 },
		readAt: { type: Date, required: false, default: null },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

MessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });
MessageSchema.index({ toUserId: 1, readAt: 1, fromUserId: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
