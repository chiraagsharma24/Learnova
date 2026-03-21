import type { Quiz } from "./quiz";

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  type: "video" | "document" | "image" | "quiz";
  status: "draft" | "published";
  order: number;
  videoUrl?: string;
  documentUrl?: string;
  imageUrl?: string;
  duration?: number;
  description?: string;
  responsibleUserId?: string;
  allowDownload?: boolean;
  attachments?: { name: string; url: string; kind: "file" | "link" }[];
  quiz?: Quiz;
}
