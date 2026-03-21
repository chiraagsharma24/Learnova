import mongoose from "mongoose";

let isConnected = false;

export async function connectMongoDB() {
	if (isConnected) return;
	const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/learnova";
	await mongoose.connect(uri);
	isConnected = true;
	console.log("Database connected");
}

export { mongoose };
