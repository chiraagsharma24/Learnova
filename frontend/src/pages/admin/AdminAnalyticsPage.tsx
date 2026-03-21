import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, BookOpen, BarChart3, Eye } from "lucide-react";

import { fetchAdminStats, fetchAdminCoursePerformance } from "@/fetchers/report";
import { cn } from "@/lib/utils";

export function AdminAnalyticsPage() {
  const { data: stats, isLoading: sLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });

  const { data: perf = [], isLoading: pLoading } = useQuery({
    queryKey: ["admin-course-performance"],
    queryFn: fetchAdminCoursePerformance,
  });

  const loading = sLoading || pLoading;

  const cards = [
    {
      label: "Total users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      accent: "bg-slate-100 text-slate-800 ring-slate-200",
    },
    {
      label: "Active learners",
      value: stats?.activeLearners ?? 0,
      icon: Users,
      accent: "bg-sky-50 text-sky-800 ring-sky-100",
    },
    {
      label: "Active instructors",
      value: stats?.activeInstructors ?? 0,
      icon: GraduationCap,
      accent: "bg-indigo-50 text-indigo-800 ring-indigo-100",
    },
    {
      label: "Courses",
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      accent: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    },
    {
      label: "Enrollments",
      value: stats?.totalEnrollments ?? 0,
      icon: BarChart3,
      accent: "bg-amber-50 text-amber-900 ring-amber-100",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-16">
      <header>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Platform totals and course-level engagement.</p>
      </header>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading analytics…</div>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div
                  className={cn(
                    "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1",
                    item.accent,
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-slate-900 tabular-nums">{item.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 bg-slate-50/50">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Course performance
              </h2>
              <span className="text-xs text-slate-500">(views & completion)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Instructor</th>
                    <th className="px-4 py-3 text-right">Views</th>
                    <th className="px-4 py-3 text-right">Enrolled</th>
                    <th className="px-4 py-3 text-right">Avg. completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {perf.map((row) => (
                    <tr key={row.courseId} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-[240px] truncate">
                        {row.title}
                        {!row.active && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-slate-400">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.instructorName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.viewCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.enrollmentCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.avgCompletion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {perf.length === 0 && (
                <p className="py-10 text-center text-slate-500 text-sm">No course data yet.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
