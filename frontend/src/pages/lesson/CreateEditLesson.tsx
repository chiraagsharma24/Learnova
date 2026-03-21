import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Save, Play, FileText, Image as ImageIcon, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

import { fetchLesson, createLesson, updateLesson } from "@/fetchers/lesson";
import { cn } from "@/lib/utils";

export function CreateEditLesson() {
  const { id: courseId, lessonId } = useParams() as { id: string; lessonId?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!lessonId;

  const [formData, setFormData] = useState({
    title: "",
    type: "video" as any,
    status: "draft" as any,
    videoUrl: "",
    documentUrl: "",
    imageUrl: "",
    duration: 5,
  });

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(courseId, lessonId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        type: lesson.type,
        status: lesson.status,
        videoUrl: lesson.videoUrl || "",
        documentUrl: lesson.documentUrl || "",
        imageUrl: lesson.imageUrl || "",
        duration: lesson.duration || 5,
      });
    }
  }, [lesson]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) =>
      isEdit ? updateLesson(courseId, lessonId!, data) : createLesson(courseId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      toast.success(`Lesson ${isEdit ? "updated" : "created"}`);

      if (!isEdit && formData.type === "quiz") {
        navigate(`/instructor/courses/${courseId}/lessons/${res._id}/quiz`);
      } else {
        navigate(`/instructor/courses/${courseId}`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Action failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isEdit && isLoading) return <div className="p-8">Loading lesson...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        to={`/instructor/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8 font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> Back to lessons
      </Link>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800">{isEdit ? "Edit Lesson" : "Add Lesson"}</h1>
          <p className="text-slate-500">Configure your lesson content and accessibility.</p>
        </div>
        <button
          form="lesson-form"
          type="submit"
          disabled={mutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> {isEdit ? "Save Changes" : "Create Lesson"}
        </button>
      </div>

      <form id="lesson-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Lesson Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Introduction to TypeScript"
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                Content Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "video", icon: Play, label: "Video" },
                  { id: "document", icon: FileText, label: "Document" },
                  { id: "image", icon: ImageIcon, label: "Image" },
                  { id: "quiz", icon: HelpCircle, label: "Quiz" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isEdit} // Prevent type change after creation
                    onClick={() => setFormData({ ...formData, type: t.id as any })}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-bold",
                      formData.type === t.id
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-50 text-slate-400 hover:border-slate-200",
                      isEdit && formData.type !== t.id && "opacity-50 grayscale",
                    )}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                Duration (mins)
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Type Specific Fields */}
          <div className="pt-4 border-t border-slate-50">
            {formData.type === "video" && (
              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                  Video URL (YouTube/Vimeo)
                </label>
                <input
                  type="url"
                  required
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}
            {formData.type === "document" && (
              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                  Document URL (PDF/Doc)
                </label>
                <input
                  type="url"
                  required
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  placeholder="https://.../guide.pdf"
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}
            {formData.type === "image" && (
              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://.../infographic.jpg"
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}
            {formData.type === "quiz" && (
              <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                <HelpCircle className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <h4 className="font-bold text-purple-900">Quiz setup required</h4>
                <p className="text-purple-600 text-sm mt-1">
                  {isEdit
                    ? "Manage your quiz questions in the Quiz Builder tab."
                    : "After creating this lesson, you will be redirected to the Quiz Builder."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Published Status</h3>
              <p className="text-xs text-slate-500 mt-1">Draft lessons are visible only to instructors.</p>
            </div>
            <div className="flex gap-2">
              {["draft", "published"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: s as any })}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                    formData.status === s
                      ? s === "published"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "bg-slate-100 border-slate-400 text-slate-700"
                      : "bg-white border-slate-50 text-slate-300 hover:border-slate-100",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
