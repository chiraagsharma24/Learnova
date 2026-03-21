import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import LandingPage from "@/components/landing";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/components/NotFound";

import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { CourseCatalog } from "@/pages/CourseCatalog";
import { LearnerDashboard } from "./pages/LearnerDashboard";
import { CourseDetail } from "@/pages/CourseDetail";

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

      {/* Not found */}
      <Route path="*" element={<NotFound />} />
    </>,
  ),
);
