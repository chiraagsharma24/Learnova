import { Route, Navigate, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { LandingPage } from "@/pages/LandingPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstructorLayout, PublicLayout } from "@/components/layouts";
import NotFound from "@/components/NotFound";

import { RegisterPage, LoginPage } from "@/pages/auth";
import { LearnerDashboard, InstructorDashboard, AdminDashboard } from "@/pages/dashboard";
import { CourseCatalog, CourseDetail, CourseList, CourseReport, CreateEditCourse } from "@/pages/course";
import { CreateEditLesson, LessonPlayer, LessonList } from "@/pages/lesson";
import { QuizBuilder } from "@/pages/QuizBuilder";
import { AttendeeList } from "@/pages/AttendeeList";
import { ReviewManagement } from "@/pages/ReviewManagement";

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
          <ProtectedRoute allowedRoles={["learner", "instructor", "admin"]}>
            <PublicLayout>
              <LearnerDashboard />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PublicLayout>
              <AdminDashboard />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Immersive Player (No Shared Layout) */}
      <Route
        path="/courses/:courseId/learn/:lessonId"
        element={
          <ProtectedRoute allowedRoles={["learner", "instructor", "admin"]}>
            <LessonPlayer />
          </ProtectedRoute>
        }
      />

      {/* Instructor Routes */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute allowedRoles={["instructor", "admin"]}>
            <InstructorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<InstructorDashboard />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/new" element={<CreateEditCourse />} />
        <Route path="courses/:id/edit" element={<CreateEditCourse />} />

        {/* Nested Course Management */}
        <Route path="courses/:id" element={<LessonList />} />
        <Route path="courses/:id/lessons/new" element={<CreateEditLesson />} />
        <Route path="courses/:id/lessons/:lessonId/edit" element={<CreateEditLesson />} />
        <Route path="courses/:id/lessons/:lessonId/quiz" element={<QuizBuilder />} />
        <Route path="courses/:id/attendees" element={<AttendeeList />} />
        <Route path="courses/:id/reviews" element={<ReviewManagement />} />
        <Route path="courses/:id/reports" element={<CourseReport />} />
      </Route>

      {/* Not found */}
      <Route path="*" element={<NotFound />} />
    </>,
  ),
);
