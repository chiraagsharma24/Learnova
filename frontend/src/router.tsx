import { Route, Navigate, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import LandingPage from "@/components/landing";
import { AuthLayout, Login, Register, ProtectedRoute } from "@/components/auth";
import { DashboardLayout, Home } from "@/components/dashboard";
import NotFound from "@/components/NotFound";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="auth/" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth" />} />
        <Route path="login/" element={<Login />} />
        <Route path="register/" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route path="dashboard/" element={<DashboardLayout />}>
          <Route path="home" element={<Home />} />
        </Route>
      </Route>

      {/* Not found */}
      <Route path="*" element={<NotFound />} />
    </>,
  ),
);
