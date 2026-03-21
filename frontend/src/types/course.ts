import type { Lesson } from "./lesson";

export interface Course {
  _id: string;
  title: string;
  image: string;
  description: string;
  active: boolean;
  visibility: "everyone" | "signed-in";
  access: "open" | "invitation" | "payment";
  websiteUrl?: string;
  courseAdminUserId?: string;
  price?: number;
  instructorId: string;
  instructorName: string;
  tags?: string[];
  viewCount?: number;
  learnerCount?: number;
  reviewCount?: number;
  /** All lessons (admin aggregate) */
  lessonCount?: number;
  /** Sum of video lesson durations in minutes (non-video = 0) */
  totalDurationMinutes?: number;
  lessons?: Lesson[];
  createdAt: string;
}

export interface Enrollment {
  _id: string;
  userId: string;
  courseId: Course | string;
  enrolledAt: string;
  completionPercentage: number;
  completedAt?: string;
  userName?: string;
  userEmail?: string;
}
