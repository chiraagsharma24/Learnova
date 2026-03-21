import type { Lesson } from "./lesson";

export interface Course {
  _id: string;
  title: string;
  image: string;
  description: string;
  active: boolean;
  visibility: "everyone" | "signed-in";
  access: "open" | "invitation";
  instructorId: string;
  instructorName: string;
  learnerCount?: number;
  reviewCount?: number;
  lessons?: Lesson[];
  createdAt: string;
}

export interface CourseReport {
  totalEnrollments: number;
  completions: number;
  completionRate: number;
  averageProgress: number;
  attendees: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
    completedLessons: number;
    totalLessons: number;
    completed: boolean;
    completedAt?: string;
  }[];
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
