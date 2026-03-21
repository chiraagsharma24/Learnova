export interface UserProfile {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: "admin" | "instructor" | "learner";
  totalPoints: number;
  badges: string[];
<<<<<<< HEAD
  level: number;
  levelName: string;
  streakCount: number;
  longestStreak: number;
  lastActiveDate?: string;
  artifacts: {
    name: string;
    description: string;
    level: number;
    unlockedAt: string;
  }[];
  isMentor?: boolean;
  maxMenteeSlots?: number;
  menteeUserIds?: string[];
  myMentorUserId?: string;
  messageCredits?: number;
  instructorRequestStatus?: "pending" | "approved" | "rejected";
  blocked?: boolean;
=======
  instructorRequestStatus?: "pending" | "approved" | "rejected";
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d
}
