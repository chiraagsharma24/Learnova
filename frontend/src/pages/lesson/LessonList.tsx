import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Play,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  ChevronLeft,
  LayoutDashboard,
  Users,
  MessageSquare,
  PieChart,
} from "lucide-react";
import toast from "react-hot-toast";

import { fetchCourse } from "@/fetchers/course";
import { fetchLessons, deleteLesson, updateLesson } from "@/fetchers/lesson";
import { cn } from "@/lib/utils";

const typeIcon = {
  video: Play,
  document: FileText,
  image: ImageIcon,
  quiz: HelpCircle,
};

export function LessonList() {
  const { id: courseId } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse(courseId),
  });

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => fetchLessons(courseId),
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => deleteLesson(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      toast.success("Lesson deleted");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: string }) =>
      updateLesson(courseId, lessonId, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      toast.success("Status updated");
    },
  });

  if (isLoading) return <div className="p-8">Loading lessons...</div>;

  return (
    <div className="flex-1 flex flex-col">
      {/* Course Header */}
      <div className="bg-white border-b border-slate-100 p-8">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Courses
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                {course?.image && <img src={course.image} className="w-full h-full object-cover" />}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800">{course?.title}</h1>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {course?.learnerCount} learners
                  </span>
                  <span className="flex items-center gap-1">Status: {course?.active ? "Active" : "Draft"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={`/instructor/courses/${courseId}/lessons/new`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <Plus className="w-4 h-4" /> Add Lesson
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-8">
            {[
              { label: "Lessons", to: `/instructor/courses/${courseId}`, active: true, icon: FileText },
              { label: "Attendees", to: `/instructor/courses/${courseId}/attendees`, icon: Users },
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

      {/* Lessons List */}
      <div className="p-8 flex-1">
        <div className="max-w-5xl mx-auto space-y-3">
          {lessons?.map((lesson, idx) => {
            const Icon = typeIcon[lesson.type as keyof typeof typeIcon] || Play;
            return (
              <div
                key={lesson._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 group"
              >
                <div className="text-slate-300 group-hover:text-slate-400 cursor-grab px-1">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    lesson.status === "published" ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-slate-800 truncate">{lesson.title}</h4>
                    <span
                      className={cn(
                        "text-[9px] uppercase font-black px-1.5 py-0.5 rounded",
                        lesson.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400",
                      )}
                    >
                      {lesson.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {lesson.type} • {lesson.duration || 5} mins
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {lesson.type === "quiz" && (
                    <Link
                      to={`/instructor/courses/${courseId}/lessons/${lesson._id}/quiz`}
                      className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                      title="Edit Quiz Questions"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Link>
                  )}
                  <Link
                    to={`/instructor/courses/${courseId}/lessons/${lesson._id}/edit`}
                    className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                    title="Edit Lesson Content"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        lessonId: lesson._id,
                        status: lesson.status === "published" ? "draft" : "published",
                      })
                    }
                    className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                    title={lesson.status === "published" ? "Unpublish" : "Publish"}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete lesson?")) deleteMutation.mutate(lesson._id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {lessons?.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No lessons added to this course yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
