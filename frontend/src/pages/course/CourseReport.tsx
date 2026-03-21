import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  ChevronLeft,
  FileText,
  MessageSquare,
  PieChart,
  Download,
  TrendingUp,
} from "lucide-react";
import { fetchCourse } from "@/fetchers/course";
import { fetchCourseReport } from "@/fetchers/report";
import { cn } from "@/lib/utils";

export function CourseReport() {
  const { id: courseId } = useParams() as { id: string };

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse(courseId),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", courseId],
    queryFn: () => fetchCourseReport(courseId),
  });

  if (isLoading) return <div className="p-8 text-slate-500">Generating report...</div>;

  const stats = [
    { label: "Total Enrollments", value: report?.totalEnrollments, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Completions", value: report?.completions, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    {
      label: "Completion Rate",
      value: `${report?.completionRate}%`,
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Average Progress",
      value: `${Math.round(report?.averageProgress || 0)}%`,
      icon: PieChart,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-slate-100 p-8">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Courses
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-2xl font-black text-slate-800">{course?.title}</h1>
            <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-8">
            {[
              { label: "Lessons", to: `/instructor/courses/${courseId}`, icon: FileText },
              { label: "Attendees", to: `/instructor/courses/${courseId}/attendees`, icon: Users },
              { label: "Reviews", to: `/instructor/courses/${courseId}/reviews`, icon: MessageSquare },
              { label: "Reports", to: `/instructor/courses/${courseId}/reports`, active: true, icon: PieChart },
            ].map((tab) => (
              <Link
                key={tab.label}
                to={tab.to}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  tab.active
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-100",
                )}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 flex-1">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", s.color)}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">{s.value}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Completion Details</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Lessons
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Completion Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {report?.attendees?.map((att: any) => (
                  <tr key={att._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{att.user.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {att.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-slate-600">
                          {att.completedLessons} / {att.totalLessons}
                        </span>
                        <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${(att.completedLessons / att.totalLessons) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {att.completed ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 font-bold italic">
                      {att.completedAt ? new Date(att.completedAt).toLocaleDateString() : "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!report?.attendees?.length && (
              <div className="p-20 text-center text-slate-400 font-medium">No completions to show.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
