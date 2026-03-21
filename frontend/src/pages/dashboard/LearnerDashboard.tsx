import { Link } from "react-router-dom";
import { Trophy, BookOpen, Clock, ArrowRight, School, Flame, Gem, X } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { fetchMyEnrollments } from "@/fetchers/enrollment";

const LEVEL_PATHS = [
  { level: 1, title: "The Novice", track: "Fundamentals", minXP: 0 },
  { level: 2, title: "The Architect", track: "DSA", minXP: 500 },
  { level: 3, title: "The Builder", track: "First Project", minXP: 1500 },
  { level: 4, title: "The Marketer", track: "Resume/LinkedIn", minXP: 3000 },
  { level: 5, title: "The Corporate Scout", track: "Internship", minXP: 5000 },
  { level: 6, title: "The Gladiator", track: "Placement Prep", minXP: 8000 },
  { level: 7, title: "The Legend", track: "Placement", minXP: 12000 },
];

export function LearnerDashboard() {
  const { user, becomeInstructor } = useAuth();

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: fetchMyEnrollments,
  });

  if (enrollmentsLoading) return <div className="p-8 text-slate-500">Loading your progress...</div>;

  const totalPoints = user?.totalPoints || 0;
  const badges = user?.badges || [];
  const artifacts = user?.artifacts || [];
  const currentLevel = user?.level || 1;
  const currentLevelMeta = LEVEL_PATHS.find((entry) => entry.level === currentLevel) || LEVEL_PATHS[0];
  const nextLevelMeta = LEVEL_PATHS.find((entry) => entry.level === currentLevel + 1);
  const xpToNext = nextLevelMeta ? Math.max(nextLevelMeta.minXP - totalPoints, 0) : 0;
  const progressInLevel = nextLevelMeta
    ? Math.min(
        Math.round(((totalPoints - currentLevelMeta.minXP) / (nextLevelMeta.minXP - currentLevelMeta.minXP || 1)) * 100),
        100
      )
    : 100;
  const activeCourses = enrollments?.filter((e) => e.completionPercentage < 100) || [];
  const completedCoursesCount = enrollments?.filter((e) => e.completionPercentage === 100).length || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {user?.name.split(" ")[0]}!</h1>
        <p className="text-slate-500 font-medium tracking-tight">
          You've earned {totalPoints} points and {badges.length} badges so far.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Core Gamification</p>
            <h2 className="text-2xl font-black text-slate-900">
              Level {currentLevel}: {user?.levelName || currentLevelMeta.title}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Track: {currentLevelMeta.track}
              {nextLevelMeta ? ` • ${xpToNext} XP to ${nextLevelMeta.title}` : " • Max level reached"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center">
              <div className="text-[11px] uppercase tracking-wider font-black text-amber-700">XP</div>
              <div className="text-lg font-black text-amber-900">{totalPoints}</div>
            </div>
            <div className="rounded-2xl bg-orange-50 px-4 py-3 text-center">
              <div className="text-[11px] uppercase tracking-wider font-black text-orange-700">Streak</div>
              <div className="text-lg font-black text-orange-900">{user?.streakCount || 0}</div>
            </div>
            <div className="rounded-2xl bg-violet-50 px-4 py-3 text-center">
              <div className="text-[11px] uppercase tracking-wider font-black text-violet-700">Artifacts</div>
              <div className="text-lg font-black text-violet-900">{artifacts.length}</div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progressInLevel}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-2 text-slate-500 font-semibold">
            <span>{progressInLevel}% in current level</span>
            <span>{nextLevelMeta ? `${xpToNext} XP remaining` : "Legend status unlocked"}</span>
          </div>
        </div>
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
                      type="button"
                      onClick={async () => {
                        try {
                          await becomeInstructor();
                          toast.success("Request re-submitted!");
                        } catch {
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
                    type="button"
                    onClick={async () => {
                      try {
                        await becomeInstructor();
                        toast.success("Request submitted to admin!");
                      } catch {
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
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Learning Path</h3>
            <div className="space-y-3">
              {LEVEL_PATHS.map((entry) => {
                const isUnlocked = currentLevel >= entry.level;
                return (
                  <div
                    key={entry.level}
                    className={`rounded-xl px-4 py-3 border ${
                      isUnlocked ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          L{entry.level} - {entry.title}
                        </p>
                        <p className="text-xs text-slate-500">{entry.track}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-black text-slate-500">
                        {isUnlocked ? "Unlocked" : `${entry.minXP} XP`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8">Learning Stats</h3>
            <div className="space-y-8">
              {[
                { label: "Current Streak", value: `${user?.streakCount || 0} days`, color: "bg-orange-500", icon: Flame },
                { label: "Longest Streak", value: `${user?.longestStreak || 0} days`, color: "bg-emerald-500", icon: Clock },
                { label: "Artifacts", value: `${artifacts.length}`, color: "bg-purple-500", icon: Gem },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <stat.icon className="w-3.5 h-3.5" />
                      {stat.label}
                    </span>
                    <span className="text-sm font-black text-slate-900">{stat.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className={stat.color + " h-full w-[75%]"} />
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
