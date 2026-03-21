import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Play, FileText, Image as ImageIcon, HelpCircle, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

import { fetchLessons, deleteLesson, updateLesson } from "@/fetchers/lesson";
import { cn } from "@/lib/utils";

const typeIcon = {
  video: Play,
  document: FileText,
  image: ImageIcon,
  quiz: HelpCircle,
};

const typeLabel: Record<string, string> = {
  video: "Video",
  document: "Document",
  image: "Image",
  quiz: "Quiz",
};

export function CourseLessonsTab({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => fetchLessons(courseId),
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => deleteLesson(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Lesson deleted");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: string }) =>
      updateLesson(courseId, lessonId, { status: status as "draft" | "published" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      toast.success("Status updated");
    },
  });

  if (isLoading) return <div className="py-12 text-center text-slate-500">Loading lessons…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          to={`/instructor/courses/${courseId}/lessons/new`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" /> Add content
        </Link>
      </div>

      {lessons?.map((lesson) => {
        const Icon = typeIcon[lesson.type as keyof typeof typeIcon] || Play;
        return (
          <div
            key={lesson._id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 group"
          >
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
                <span className="text-[10px] font-black text-slate-500 uppercase">{typeLabel[lesson.type] || lesson.type}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {lesson.status === "published" ? "Published" : "Draft"}
                {lesson.type === "video" && lesson.duration != null ? ` · ${lesson.duration} min` : ""}
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Lesson actions"
                onClick={() => setOpenMenuId((id) => (id === lesson._id ? null : lesson._id))}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {openMenuId === lesson._id && (
              <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-white border border-slate-100 rounded-xl shadow-lg z-20">
                {lesson.type === "quiz" && (
                  <Link
                    to={`/instructor/courses/${courseId}/lessons/${lesson._id}/quiz`}
                    className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Edit quiz
                  </Link>
                )}
                <Link
                  to={`/instructor/courses/${courseId}/lessons/${lesson._id}/edit`}
                  className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    setOpenMenuId(null);
                    if (confirm("Delete this lesson?")) deleteMutation.mutate(lesson._id);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-50"
                  onClick={() => {
                    setOpenMenuId(null);
                    toggleStatusMutation.mutate({
                      lessonId: lesson._id,
                      status: lesson.status === "published" ? "draft" : "published",
                    });
                  }}
                >
                  {lesson.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </div>
              )}
            </div>
          </div>
        );
      })}

      {lessons?.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium mb-4">No lessons yet.</p>
          <Link
            to={`/instructor/courses/${courseId}/lessons/new`}
            className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
          >
            Add your first lesson
          </Link>
        </div>
      )}
    </div>
  );
}
