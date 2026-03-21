import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Save, Globe, Lock } from "lucide-react";
import { fetchCourse, createCourse, updateCourse } from "@/fetchers/course";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function CreateEditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

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
    visibility: "everyone",
    access: "open",
    active: true,
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: isEdit,
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
      });
    }
  }, [course]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => (isEdit ? updateCourse(id!, data) : createCourse(data)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success(`Course ${isEdit ? "updated" : "created"}`);
      navigate(isEdit ? "/instructor/courses" : `/instructor/courses/${res._id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Action failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isEdit && isLoading) return <div className="p-8">Loading course data...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        to="/instructor/courses"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8 font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> Back to courses
      </Link>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800">{isEdit ? "Edit Course" : "Create New Course"}</h1>
          <p className="text-slate-500">Provide the core details for your learning program.</p>
        </div>
        <button
          form="course-form"
          type="submit"
          disabled={mutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> {isEdit ? "Save Changes" : "Create Course"}
        </button>
      </div>

      <form id="course-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Course Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Modern Web Development with React"
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold placeholder:text-slate-300"
            />
          </div>

          <div>
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
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Description (HTML supported)
            </label>
            <textarea
              rows={10}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write a compelling description for your course..."
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all min-h-[200px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs mb-6 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" /> Visibility & Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700">Course Visibility</span>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  className="bg-white border-none rounded-xl text-sm font-bold focus:ring-0"
                >
                  <option value="everyone">Everyone</option>
                  <option value="signed-in">Signed In Only</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700">Active Status</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    formData.active ? "bg-emerald-500" : "bg-slate-300",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 bg-white w-4 h-4 rounded-full transition-all",
                      formData.active ? "right-1" : "left-1",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs mb-6 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" /> Access Control
            </h3>
            <div className="space-y-4">
              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                  formData.access === "open" ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-transparent",
                )}
              >
                <input
                  type="radio"
                  name="access"
                  value="open"
                  checked={formData.access === "open"}
                  onChange={() => setFormData({ ...formData, access: "open" })}
                  className="hidden"
                />
                <div className="flex-1">
                  <span className="block text-sm font-bold text-slate-800">Open for all</span>
                  <span className="text-[10px] text-slate-500 font-medium">Anyone can enroll immediately</span>
                </div>
                {formData.access === "open" && (
                  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Save className="w-3 h-3 text-white" />
                  </div>
                )}
              </label>

              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                  formData.access === "invitation"
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-slate-50 border-transparent",
                )}
              >
                <input
                  type="radio"
                  name="access"
                  value="invitation"
                  checked={formData.access === "invitation"}
                  onChange={() => setFormData({ ...formData, access: "invitation" })}
                  className="hidden"
                />
                <div className="flex-1">
                  <span className="block text-sm font-bold text-slate-800">Invitation Only</span>
                  <span className="text-[10px] text-slate-500 font-medium">Restricted access control</span>
                </div>
                {formData.access === "invitation" && (
                  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Save className="w-3 h-3 text-white" />
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
