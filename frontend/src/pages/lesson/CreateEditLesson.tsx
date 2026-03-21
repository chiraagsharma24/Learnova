import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Save,
  Play,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Layers,
  AlignLeft,
  Paperclip,
} from "lucide-react";
import toast from "react-hot-toast";

import { fetchLesson, createLesson, updateLesson } from "@/fetchers/lesson";
import { fetchStaffForCourseAdmin } from "@/fetchers/user";
import { cn } from "@/lib/utils";

type LessonTab = "content" | "description" | "attachments";

export function CreateEditLesson() {
  const { id: courseId, lessonId } = useParams() as { id: string; lessonId?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!lessonId;
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("t") as LessonTab) || "content";
  const activeTab: LessonTab = ["content", "description", "attachments"].includes(tab) ? tab : "content";

  const [formData, setFormData] = useState({
    title: "",
    type: "video" as "video" | "document" | "image" | "quiz",
    status: "draft" as "draft" | "published",
    videoUrl: "",
    documentUrl: "",
    imageUrl: "",
    duration: 5,
    description: "",
    responsibleUserId: "",
    allowDownload: true,
    attachments: [] as { name: string; url: string; kind: "file" | "link" }[],
  });

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(courseId, lessonId!),
    enabled: isEdit,
  });

  const { data: staffList } = useQuery({
    queryKey: ["staff-course-admin"],
    queryFn: fetchStaffForCourseAdmin,
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
        duration: lesson.duration ?? (lesson.type === "video" ? 5 : 0),
        description: lesson.description ?? "",
        responsibleUserId: lesson.responsibleUserId ?? "",
        allowDownload: lesson.allowDownload !== false,
        attachments: lesson.attachments?.length ? [...lesson.attachments] : [],
      });
    }
  }, [lesson]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) =>
      isEdit ? updateLesson(courseId, lessonId!, data) : createLesson(courseId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success(`Lesson ${isEdit ? "updated" : "created"}`);

      if (!isEdit && formData.type === "quiz") {
        navigate(`/instructor/courses/${courseId}/lessons/${res._id}/quiz`);
      } else {
        navigate(`/instructor/courses/${courseId}/edit?tab=content`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Action failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Lesson title is required.");
      setTab("content");
      return;
    }
    const payload = {
      ...formData,
      duration: formData.type === "video" ? formData.duration : 0,
    };
    mutation.mutate(payload);
  };

  const setTab = (t: LessonTab) => setSearchParams({ t }, { replace: true });

  const addAttachment = (kind: "file" | "link") => {
    setFormData({
      ...formData,
      attachments: [...formData.attachments, { name: kind === "link" ? "Link" : "Resource", url: "", kind }],
    });
  };

  if (isEdit && isLoading) return <div className="p-8">Loading lesson…</div>;

  const lessonTabs: { id: LessonTab; label: string; icon: typeof Layers }[] = [
    { id: "content", label: "Content", icon: Layers },
    { id: "description", label: "Description", icon: AlignLeft },
    { id: "attachments", label: "Additional attachment", icon: Paperclip },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        to={`/instructor/courses/${courseId}/edit?tab=content`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8 font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> Back to course
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">{isEdit ? "Edit Lesson" : "Add Lesson"}</h1>
          <p className="text-slate-500 text-sm">Content, description, and extra resources for learners.</p>
        </div>
        <button
          form="lesson-form"
          type="submit"
          disabled={mutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> Save
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-1">
        {lessonTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-colors",
              activeTab === t.id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100",
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <form id="lesson-form" onSubmit={handleSubmit} className="space-y-8">
        {activeTab === "content" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                Lesson title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "video" as const, icon: Play, label: "Video" },
                  { id: "document" as const, icon: FileText, label: "Document" },
                  { id: "image" as const, icon: ImageIcon, label: "Image" },
                  { id: "quiz" as const, icon: HelpCircle, label: "Quiz" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isEdit}
                    onClick={() => setFormData({ ...formData, type: t.id })}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold",
                      formData.type === t.id
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-50 text-slate-400",
                      isEdit && formData.type !== t.id && "opacity-50",
                    )}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                Responsible (optional)
              </label>
              <select
                value={formData.responsibleUserId}
                onChange={(e) => setFormData({ ...formData, responsibleUserId: e.target.value })}
                className="w-full max-w-lg px-4 py-3 bg-slate-50 rounded-xl font-bold text-sm border-none"
              >
                <option value="">— None —</option>
                {staffList?.map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            {formData.type === "video" && (
              <>
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                    Video URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="YouTube / Drive / …"
                    className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 0 })}
                    className="w-full max-w-xs px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                  />
                </div>
              </>
            )}

            {formData.type === "document" && (
              <>
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                    Document URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.allowDownload}
                    onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  Allow download
                </label>
              </>
            )}

            {formData.type === "image" && (
              <>
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.allowDownload}
                    onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  Allow download
                </label>
              </>
            )}

            {formData.type === "quiz" && (
              <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                <HelpCircle className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <p className="text-purple-800 text-sm font-medium">
                  After saving, use the Quiz tab on the course or open the quiz builder to add questions.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-50 flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: s })}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase border-2",
                    formData.status === s
                      ? s === "published"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "bg-slate-100 border-slate-400 text-slate-700"
                      : "bg-white border-slate-50 text-slate-300",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "description" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Lesson description (learners)
            </label>
            <textarea
              rows={12}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 min-h-[240px]"
            />
          </div>
        )}

        {activeTab === "attachments" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
            <p className="text-sm text-slate-500">
              Extra files or links shown to learners with this lesson (URLs must be reachable by learners).
            </p>
            {formData.attachments.map((att, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <input
                  placeholder="Label"
                  value={att.name}
                  onChange={(e) => {
                    const next = [...formData.attachments];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setFormData({ ...formData, attachments: next });
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border-none text-sm font-bold"
                />
                <input
                  placeholder={att.kind === "link" ? "https://…" : "File URL"}
                  value={att.url}
                  onChange={(e) => {
                    const next = [...formData.attachments];
                    next[idx] = { ...next[idx], url: e.target.value };
                    setFormData({ ...formData, attachments: next });
                  }}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border-none text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      attachments: formData.attachments.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-rose-600 text-sm font-bold px-2"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addAttachment("file")}
                className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
              >
                + File URL
              </button>
              <button
                type="button"
                onClick={() => addAttachment("link")}
                className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
              >
                + External link
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
