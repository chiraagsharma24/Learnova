import { Link, useNavigate } from "react-router-dom";
import { Trophy, BookOpen, Clock, ArrowRight, School, X } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

import { fetchLearnerStats } from "@/fetchers/progress";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyEnrollments } from "@/fetchers/enrollment";

export function LearnerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, becomeInstructor } = useAuth();

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: fetchMyEnrollments,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["learner-stats"],
    queryFn: fetchLearnerStats,
  });

  if (enrollmentsLoading || statsLoading) return <div className="p-8 text-slate-500">Loading your progress...</div>;

  const totalPoints = stats?.totalPoints || 0;
  const badgesCount = stats?.badgesCount || 0;
  const activeCourses = enrollments?.filter((e) => e.completionPercentage < 100) || [];
  const completedCoursesCount = stats?.completedCoursesCount || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {user?.name.split(" ")[0]}!</h1>
        <p className="text-slate-500 font-medium tracking-tight">
          You've earned {totalPoints} points and {badgesCount} badges so far.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {user?.role === "learner" && (
            <div className="bg-indigo-600 rounded-[2rem] p-8 mb-10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                <School className="w-32 h-32 text-white" />
              </div>
              <div className="relative">
                <h2 className="text-2xl font-black text-white mb-2">Want to share your knowledge?</h2>
                <p className="text-indigo-100 font-medium mb-6 max-w-md">
                  Upgrade your account to an instructor profile and start creating your own courses today.
                </p>
                {user?.instructorRequestStatus === "pending" ? (
                  <div className="bg-amber-50 text-amber-700 px-6 py-4 rounded-xl font-bold border border-amber-100 flex items-center gap-3">
                    <Clock className="w-5 h-5" /> Your instructor request is pending admin approval.
                  </div>
                ) : user?.instructorRequestStatus === "rejected" ? (
                  <div className="space-y-4">
                    <div className="bg-rose-50 text-rose-700 px-6 py-4 rounded-xl font-bold border border-rose-100 flex items-center gap-3">
                      <X className="w-5 h-5" /> Your instructor request was declined.
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await becomeInstructor();
                          toast.success("Request re-submitted!");
                          queryClient.invalidateQueries({ queryKey: ["user"] });
                        } catch (err) {
                          toast.error("Failed to submit request");
                        }
                      }}
                      className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 shadow-xl shadow-indigo-900/20"
                    >
                      Try Again <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        await becomeInstructor();
                        toast.success("Request submitted to admin!");
                        queryClient.invalidateQueries({ queryKey: ["user"] });
                      } catch (err) {
                        toast.error("Failed to submit request");
                      }
                    }}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 shadow-xl shadow-indigo-900/20"
                  >
                    Become an Instructor <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 font-black text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-2xl font-black text-slate-900">{enrollments?.length || 0}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrolled Courses</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 font-black text-amber-600">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalPoints}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Points</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 font-black text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-2xl font-black text-slate-900">{completedCoursesCount}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed</div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Active Courses</h3>
              <Link to="/courses" className="text-xs font-black text-indigo-600 uppercase hover:underline">
                Browse More
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {activeCourses.map((enroll) => (
                <div key={enroll._id} className="p-8 hover:bg-slate-50/50 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                        {typeof enroll.courseId !== "string" && enroll.courseId.image && (
                          <img src={enroll.courseId.image} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg mb-1">
                          {typeof enroll.courseId === "string" ? "Course" : enroll.courseId.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-slate-400 font-bold">
                          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] uppercase">
                            {enroll.completionPercentage}% Complete
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Enrolled{" "}
                            {new Date(enroll.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={typeof enroll.courseId === "string" ? "#" : `/courses/${enroll.courseId._id}`}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all self-start md:self-center shadow-lg group-hover:scale-105 active:scale-95"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="mt-6 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-1000"
                      style={{ width: `${enroll.completionPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {activeCourses.length === 0 && (
                <div className="p-20 text-center text-slate-400 font-medium">
                  No active courses. Time to start learning!
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/*<div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="w-32 h-32" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-indigo-400 text-xs">Achiements</h3>
              <div className="space-y-6">
                {user?.badges && user.badges.length > 0 ? (
                  user.badges.map((badge: string, i: number) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                      <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-black text-sm uppercase tracking-widest">{badge}</div>
                        <div className="text-xs text-indigo-300 font-bold">Badge Unlocked</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-indigo-300/50 text-sm font-bold italic py-4">
                    No badges earned yet. Complete lessons to unlock!
                  </div>
                )}
              </div>
            </div>
          </div>*/}

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8">Learning Stats</h3>
            <div className="space-y-8">
              {[
                { label: "Quizzes Taken", value: stats?.quizzesTaken || 0, color: "bg-blue-500" },
                { label: "Avg. Score", value: stats?.averageScore || "0%", color: "bg-emerald-500" },
                { label: "Certificates", value: stats?.completedCoursesCount || 0, color: "bg-purple-500" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-sm font-black text-slate-900">{stat.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className={cn(stat.color, "h-full transition-all duration-1000")}
                      style={{
                        width:
                          stat.label === "Avg. Score"
                            ? stat.value
                            : stat.label === "Quizzes Taken"
                              ? `${Math.min((stat.value as number) * 10, 100)}%`
                              : `${Math.min((stat.value as number) * 20, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
