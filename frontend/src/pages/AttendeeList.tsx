import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Users, UserMinus, Clock, ChevronLeft, FileText, MessageSquare, PieChart } from "lucide-react";
import toast from "react-hot-toast";

import { fetchCourse } from "@/fetchers/course";
import { fetchCourseAttendees, removeAttendee } from "@/fetchers/enrollment";
import { cn } from "@/lib/utils";
import type { Enrollment } from "@/types/course";

export function AttendeeList() {
  const { id: courseId } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse(courseId),
  });

  const { data: attendees, isLoading } = useQuery({
    queryKey: ["attendees", courseId],
    queryFn: () => fetchCourseAttendees(courseId),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeAttendee(courseId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendees", courseId] });
      toast.success("Student removed from course");
    },
  });

  if (isLoading) return <div className="p-8">Loading attendees...</div>;

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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-800">{course?.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-8">
            {[
              { label: "Lessons", to: `/instructor/courses/${courseId}`, icon: FileText },
              { label: "Attendees", to: `/instructor/courses/${courseId}/attendees`, active: true, icon: Users },
              { label: "Reviews", to: `/instructor/courses/${courseId}/reviews`, icon: MessageSquare },
              { label: "Reports", to: `/instructor/courses/${courseId}/reports`, icon: PieChart },
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
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendees?.map((att: Enrollment) => (
                  <tr key={att._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-600">
                          {att.userName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{att.userName}</div>
                          <div className="text-xs text-slate-400">{att.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="text-xs font-black text-slate-700">{att.completionPercentage}%</div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              att.completionPercentage === 100 ? "bg-emerald-500" : "bg-indigo-500",
                            )}
                            style={{ width: `${att.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(att.enrolledAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm("Remove student from course?")) removeMutation.mutate(att.user._id);
                        }}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Remove Student"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendees?.length === 0 && (
              <div className="p-20 text-center text-slate-400 font-medium">No students enrolled yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
