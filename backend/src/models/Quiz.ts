import mongoose, { Schema, Document } from "mongoose";

export interface IQuizChoice {
    text: string;
    isCorrect: boolean;
}

export interface IQuizQuestion {
    _id?: mongoose.Types.ObjectId;
    question: string;
    choices: IQuizChoice[];
}

export interface IAttemptReward {
    attempt: number; // 1-based attempt number
    pointsPercentage: number; // e.g., 100 for 100%, 50 for 50%
}

export interface IQuiz extends Document {
    lessonId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    questions: IQuizQuestion[];
    totalPoints: number; // Base points for full score on first attempt
    attemptRewards: IAttemptReward[];
    createdAt: Date;
    updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
    question: { type: String, required: true },
    choices: [
        {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
        },
    ],
});

const QuizSchema = new Schema<IQuiz>(
    {
        lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
        courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
        questions: [QuizQuestionSchema],
        totalPoints: { type: Number, default: 100 },
        attemptRewards: [
            {
                attempt: { type: Number, required: true },
                pointsPercentage: { type: Number, required: true },
            },
        ],
    },
    { timestamps: true }
);

// Default attempt rewards if not set: 100% first, 50% second, 25% third
QuizSchema.pre("save", async function () {
    if (!this.attemptRewards || this.attemptRewards.length === 0) {
        this.attemptRewards = [
            { attempt: 1, pointsPercentage: 100 },
            { attempt: 2, pointsPercentage: 50 },
            { attempt: 3, pointsPercentage: 25 },
        ];
    }
});

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
