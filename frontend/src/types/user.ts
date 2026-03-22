export interface UserProfile {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: "admin" | "instructor" | "learner";
  totalPoints: number;
  badges: string[];
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
}
