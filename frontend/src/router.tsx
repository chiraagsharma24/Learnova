import { Route, Navigate, createBrowserRouter, createRoutesFromElements, useParams } from "react-router-dom";

import { LandingPage } from "@/pages/LandingPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout, InstructorLayout, PublicLayout } from "@/components/layouts";
import NotFound from "@/components/NotFound";

import { RegisterPage, LoginPage } from "@/pages/auth";
import { AdminDashboard, LearnerDashboardGate, InstructorReportingPage } from "@/pages/dashboard";
import {
  AdminUsersPage,
  AdminCoursesPage,
  AdminAnalyticsPage,
  AdminSettingsPage,
} from "@/pages/admin";
import { CourseCatalog, CourseDetail, CourseList, CreateEditCourse } from "@/pages/course";
import { CreateEditLesson, LessonPlayer } from "@/pages/lesson";
import { QuizBuilder } from "@/pages/QuizBuilder";
import { MentorshipPage } from "@/pages/MentorshipPage";

/** Instructor course hub lives on the edit page (Content tab). */
function InstructorCourseRedirect() {
  const { id } = useParams() as { id: string };
  return <Navigate to={`/instructor/courses/${id}/edit?tab=content`} replace />;
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Learner Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["learner", "instructor"]}>
            <PublicLayout>
              <LearnerDashboardGate />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin back-office (no learner gamification / instructor author tools) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/mentorship"
        element={
          <ProtectedRoute allowedRoles={["learner"]}>
            <PublicLayout>
              <MentorshipPage />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Immersive Player (No Shared Layout) */}
      <Route
        path="/courses/:courseId/learn/:lessonId"
        element={
          <ProtectedRoute allowedRoles={["learner", "instructor"]}>
            <LessonPlayer />
          </ProtectedRoute>
        }
      />

      {/* Instructor Routes — A1–A8 scope only */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="reporting" replace />} />
        <Route path="reporting" element={<InstructorReportingPage />} />
        <Route path="dashboard" element={<Navigate to="/instructor/reporting" replace />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/new" element={<Navigate to="/instructor/courses" replace />} />
        <Route path="courses/:id/edit" element={<CreateEditCourse />} />

        <Route path="courses/:id/lessons/new" element={<CreateEditLesson />} />
        <Route path="courses/:id/lessons/:lessonId/edit" element={<CreateEditLesson />} />
        <Route path="courses/:id/lessons/:lessonId/quiz" element={<QuizBuilder />} />
        <Route path="courses/:id" element={<InstructorCourseRedirect />} />
      </Route>

      {/* Not found */}
      <Route path="*" element={<NotFound />} />
    </>,
  ),
);
