import express from "express";
import type { Request, Response, NextFunction } from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authConfig from "./auth/index.js";
import { connectMongoDB } from "./database/mongoose.js";
import { failure, success } from "./config/response.js";

import coursesRouter from "./routes/courses/index.js";
import lessonsRouter from "./routes/lessons/index.js";
import quizzesRouter from "./routes/quizzes/index.js";
import enrollmentsRouter from "./routes/enrollments/index.js";
import progressRouter from "./routes/progress/index.js";
import reviewsRouter from "./routes/reviews/index.js";
import usersRouter from "./routes/users/index.js";
import reportsRouter from "./routes/reports/index.js";

const app = express();

// Connect to MongoDB
connectMongoDB().catch(console.error);

// CORS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "10mb" }));

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  return failure(res, 500, `Internal Server Error: ${err}`);
});

// Auth
app.all("/api/auth/*splat", toNodeHandler(authConfig));

// Health check
app.get("/", (_, res) => success(res, 200, "Learnova API is running 🚀"));

// Routes
app.use("/api/courses", coursesRouter);
app.use("/api/courses/:courseId/lessons", lessonsRouter);
app.use("/api/courses/:courseId/lessons/:lessonId/quiz", quizzesRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/progress", progressRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);

export default app;
