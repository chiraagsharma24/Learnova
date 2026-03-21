export type LearnerProgressStatus = "yet_to_start" | "in_progress" | "completed";

export interface InstructorReportOverview {
  totalParticipants: number;
  yetToStart: number;
  inProgress: number;
  completed: number;
}

export interface InstructorReportRow {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  participantName: string;
  participantEmail: string;
  enrolledAt: string;
  startDate: string | null;
  timeSpentMinutes: number;
  completionPercentage: number;
  completedAt: string | null;
  status: LearnerProgressStatus;
}

export interface InstructorOverviewResponse {
  overview: InstructorReportOverview;
  rows: InstructorReportRow[];
}
