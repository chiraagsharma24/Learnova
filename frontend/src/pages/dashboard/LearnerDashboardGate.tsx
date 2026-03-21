import { Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

import { LearnerDashboard } from "./LearnerDashboard";

/**
 * Learner-only gamification dashboard. Instructors use /instructor/* (Inspiration parity).
 */
export function LearnerDashboardGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (user?.role === "instructor") {
    return <Navigate to="/instructor/reporting" replace />;
  }

  return <LearnerDashboard />;
}
