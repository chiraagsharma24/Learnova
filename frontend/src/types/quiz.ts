export interface Quiz {
  _id: string;
  lessonId: string;
  courseId: string;
  questions: QuizQuestion[];
  totalPoints: number;
  attemptRewards: { attempt: number; pointsPercentage: number }[];
}

export interface QuizQuestion {
  _id: string;
  question: string;
  choices: { _id: string; text: string; isCorrect?: boolean }[];
}
