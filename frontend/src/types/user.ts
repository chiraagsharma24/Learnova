export interface UserProfile {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: "admin" | "instructor" | "learner";
  totalPoints: number;
  badges: string[];
}
