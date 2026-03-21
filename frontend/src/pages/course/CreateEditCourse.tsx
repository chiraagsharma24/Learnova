import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Save,
  Globe,
  Lock,
  Tag,
  Eye,
  UserPlus,
  Mail,
  FileText,
  AlignLeft,
  Settings2,
  HelpCircle,
  Plus,
} from "lucide-react";
import { fetchCourse, updateCourse } from "@/fetchers/course";
import { fetchLessons } from "@/fetchers/lesson";
import { fetchStaffForCourseAdmin } from "@/fetchers/user";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

import { CourseLessonsTab } from "./CourseLessonsTab";

type TabId = "content" | "description" | "options" | "quiz";

const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "content", label: "Content", icon: FileText },
  { id: "description", label: "Description", icon: AlignLeft },
  { id: "options", label: "Options", icon: Settings2 },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
];

export function CreateEditCourse() {
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as TabId) || "content";
  const activeTab: TabId = tabs.some((t) => t.id === tabParam) ? tabParam : "content";

  const [formData, setFormData] = useState<{
    title: string;
    image: string;
    description: string;
    visibility: "everyone" | "signed-in";
    access: "open" | "invitation";
    active: boolean;
  }>({
    title: "",
    image: "",
    description: "",
    visibility: "everyone" as "everyone" | "signed-in",
    access: "open" as "open" | "invitation" | "payment",
    active: true,
    tags: [] as string[],
    websiteUrl: "",
    courseAdminUserId: "",
    price: 0,
  });
  const [tagInput, setTagInput] = useState("");
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

  const { data: staffList } = useQuery({
    queryKey: ["staff-course-admin"],
    queryFn: fetchStaffForCourseAdmin,
  });

  const { data: lessons } = useQuery({
    queryKey: ["lessons", id],
    queryFn: () => fetchLessons(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        image: course.image,
        description: course.description,
        visibility: course.visibility,
        access: course.access,
        active: course.active,
        tags: course.tags?.length ? [...course.tags] : [],
        websiteUrl: course.websiteUrl ?? "",
        courseAdminUserId: course.courseAdminUserId ?? "",
        price: course.price ?? 0,
      });
    }
  }, [course]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => updateCourse(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", id] });
      toast.success("Course updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Action failed");
    },
  });

  const setTab = (t: TabId) => {
    setSearchParams({ tab: t }, { replace: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.active && !formData.websiteUrl.trim()) {
      toast.error("Website URL is required when the course is published on the website.");
      setTab("options");
      return;
    }
    mutation.mutate(formData);
  };

  const previewUrl = id ? `/courses/${id}` : "/courses";

  if (!id) return <Navigate to="/instructor/courses" replace />;

  if (isLoading) return <div className="p-8">Loading course…</div>;

  const quizLessons = lessons?.filter((l) => l.type === "quiz") ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <Link
        to="/instructor/courses"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> Back to courses
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Edit Course</h1>
          <p className="text-slate-500 text-sm">Configure content, access, and quizzes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700">
            <span>Publish on website</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={cn(
                "w-11 h-6 rounded-full transition-all relative shrink-0",
                formData.active ? "bg-emerald-500" : "bg-slate-300",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 bg-white w-4 h-4 rounded-full transition-all",
                  formData.active ? "right-1" : "left-1",
                )}
              />
            </button>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Eye className="w-4 h-4" /> Preview
          </a>
          <button
            type="button"
            onClick={() => setAttendeesOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <UserPlus className="w-4 h-4" /> Add Attendees
          </button>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Mail className="w-4 h-4" /> Contact Attendees
          </button>
          <button
            form="course-form"
            type="submit"
            disabled={mutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <form id="course-form" onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-lg font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
<<<<<<< HEAD
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Course image (URL)
            </label>
            <div className="flex gap-4">
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://…"
                className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <div className="w-24 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                {formData.image && <img src={formData.image} alt="" className="w-full h-full object-cover" />}
=======
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Course Cover Image
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, image: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  Recommendation: 1280x720px, max 2MB
                </p>
              </div>
              <div className="w-20 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                {formData.image && <img src={formData.image} className="w-full h-full object-cover" />}
>>>>>>> 57a5d94da89b1f755c3515d7e0ab6fccc78b2e7d
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-colors",
                activeTab === t.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100",
              )}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === "content" && id && <CourseLessonsTab courseId={id} />}

        {activeTab === "description" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Learner-facing description
            </label>
            <textarea
              rows={14}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 min-h-[280px]"
            />
          </div>
        )}

        {activeTab === "options" && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
              <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" /> Visibility
              </h3>
              <p className="text-xs text-slate-500 -mt-4">Who can see the course catalog entry.</p>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({ ...formData, visibility: e.target.value as "everyone" | "signed-in" })
                }
                className="w-full max-w-md px-4 py-3 bg-slate-50 rounded-xl font-bold text-sm border-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="everyone">Everyone</option>
                <option value="signed-in">Signed in</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
              <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" /> Access rule
              </h3>
              <p className="text-xs text-slate-500">Who can start or continue learning.</p>
              {(["open", "invitation", "payment"] as const).map((a) => (
                <label
                  key={a}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer",
                    formData.access === a ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-transparent",
                  )}
                >
                  <input
                    type="radio"
                    name="access"
                    checked={formData.access === a}
                    onChange={() => setFormData({ ...formData, access: a })}
                    className="text-indigo-600"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-800 capitalize">
                      {a === "open" ? "Open" : a === "invitation" ? "On invitation" : "On payment"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {a === "open" && "Learners can self-enroll."}
                      {a === "invitation" && "Only invited learners may enroll."}
                      {a === "payment" && "Require payment before access."}
                    </span>
                  </div>
                </label>
              ))}
              {formData.access === "payment" && (
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Price</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="mt-2 w-full max-w-xs px-4 py-3 bg-slate-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Website (required when published) *
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://yoursite.com/course-page"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Course admin / responsible
              </label>
              <select
                value={formData.courseAdminUserId}
                onChange={(e) => setFormData({ ...formData, courseAdminUserId: e.target.value })}
                className="w-full max-w-lg px-4 py-3 bg-slate-50 rounded-xl font-bold text-sm border-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— None —</option>
                {staffList?.map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.name} ({s.email}) · {s.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
                <Tag className="w-4 h-4 text-indigo-500" /> Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-8">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-100"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
                      }
                      className="p-0.5 rounded hover:bg-indigo-100 text-indigo-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const v = tagInput.trim();
                  if (!v || formData.tags.includes(v)) return;
                  setFormData({ ...formData, tags: [...formData.tags, v] });
                  setTagInput("");
                }}
                placeholder="Type a tag and press Enter"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
            <p className="text-sm text-slate-500">
              Quiz lessons for this course. Add a lesson with type &quot;Quiz&quot; under Content, then build questions here.
            </p>
            <div className="space-y-2">
              {quizLessons.map((l) => (
                <div
                  key={l._id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/80"
                >
                  <span className="font-bold text-slate-800">{l.title}</span>
                  <Link
                    to={`/instructor/courses/${id}/lessons/${l._id}/quiz`}
                    className="text-sm font-bold text-indigo-600 hover:underline"
                  >
                    Edit / Delete in builder
                  </Link>
                </div>
              ))}
            </div>
            <Link
              to={`/instructor/courses/${id}/lessons/new`}
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add quiz lesson (content tab)
            </Link>
          </div>
        )}
      </form>

      {attendeesOpen && (
        <PlaceholderModal
          title="Add Attendees"
          body="Invite learners by email will be available when outbound email is connected. For now, share the course link from the courses list."
          onClose={() => setAttendeesOpen(false)}
        />
      )}
      {contactOpen && (
        <PlaceholderModal
          title="Contact Attendees"
          body="Bulk email to enrolled learners requires mail integration. This placeholder will be replaced with the mail wizard."
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
}

function PlaceholderModal({
  title,
  body,
  onClose,
}: {
  title: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" role="dialog">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{body}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
}
