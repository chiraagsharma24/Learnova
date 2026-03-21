import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Search,
  Share2,
  Users,
  MessageSquare,
  BarChart2,
  Layers,
  Clock,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAdminCourses, deleteCourse, updateCourse, createCourse } from "@/fetchers/course";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import type { Course } from "@/types/course";

function formatTotalDurationMinutes(m: number) {
  if (!m || m <= 0) return "0";
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  if (h > 0) return `${h}h ${min}m`;
  return `${min} min`;
}

type ViewMode = "kanban" | "list";

function CourseAdminCard({
  course,
  viewMode,
  onRemoveTag,
  onDelete,
  onToggleActive,
  onShare,
  deletePending,
  togglePending,
  removeTagPending,
}: {
  course: Course;
  viewMode: ViewMode;
  onRemoveTag: (courseId: string, tag: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onShare: (course: Course) => void;
  deletePending: boolean;
  togglePending: boolean;
  removeTagPending: boolean;
}) {
  const tags = course.tags ?? [];
  const views = course.viewCount ?? 0;
  const lessons = course.lessonCount ?? 0;
  const duration = formatTotalDurationMinutes(course.totalDurationMinutes ?? 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative flex flex-col">
      {course.active && (
        <div className="pointer-events-none absolute right-0 top-0 z-1 overflow-hidden w-24 h-24">
          <div className="absolute right-[-38px] top-[18px] w-[140px] rotate-45 bg-emerald-500 text-center text-[9px] font-black text-white py-1 shadow-sm tracking-widest">
            PUBLISHED
          </div>
        </div>
      )}

      {/* Body: thumb + meta — never shares a row with actions (fixes Kanban overlap) */}
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div
          className={cn(
            "w-full h-36 sm:h-auto sm:min-h-[132px] bg-slate-100 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100",
            viewMode === "list" ? "sm:w-44" : "sm:w-40",
          )}
        >
          {course.image ? (
            <img src={course.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Layers className="w-10 h-10" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-5 pr-14 sm:pr-16">
          <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">{course.title}</h3>

          <div className="flex flex-wrap gap-1.5 mb-3 min-h-6 items-center">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 pl-2 pr-1 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/80"
              >
                {tag}
                <button
                  type="button"
                  disabled={removeTagPending}
                  onClick={() => onRemoveTag(course._id, tag)}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-50"
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length === 0 && <span className="text-[11px] text-slate-400">No tags</span>}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 text-[11px] text-slate-600 font-semibold">
            <span className="flex items-center gap-1.5 tabular-nums" title="Views">
              <BarChart2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{views} views</span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums" title="Lessons">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{lessons} lessons</span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums" title="Duration">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{duration}</span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{course.learnerCount ?? 0} students</span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{course.reviewCount ?? 0} reviews</span>
            </span>
            <span className="flex items-center gap-1.5 col-span-2 sm:col-span-1 text-slate-500 normal-case font-medium">
              <span className="truncate">Visibility: {course.visibility}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated action row — full width, never overlaps stats */}
      <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-5 border-t border-slate-100 bg-slate-50/70">
        <button
          type="button"
          onClick={() => onShare(course)}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
        <Link
          to={`/instructor/courses/${course._id}/edit?tab=content`}
          className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 p-2 text-slate-600 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors"
          title="Content & lessons"
        >
          <FileText className="w-3.5 h-3.5" />
        </Link>
        <Link
          to={`/instructor/courses/${course._id}/edit`}
          className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 p-2 text-slate-600 shadow-sm hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-700 transition-colors"
          title="Edit course"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => onToggleActive(course._id, !course.active)}
          disabled={togglePending}
          className={cn(
            "inline-flex items-center justify-center rounded-lg border p-2 transition-colors disabled:opacity-50",
            course.active
              ? "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100",
          )}
          title={course.active ? "Unpublish (draft)" : "Publish"}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Are you sure?")) onDelete(course._id);
          }}
          disabled={deletePending}
          className="inline-flex items-center justify-center rounded-lg border border-rose-100 bg-white p-2 text-rose-500 shadow-sm hover:bg-rose-50 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function CourseList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses", debouncedSearch],
    queryFn: () => fetchAdminCourses(debouncedSearch),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course deleted");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCourse(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Visibility updated");
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => updateCourse(id, { tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Tag removed");
    },
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createCourse({ title, active: false }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course created");
      setCreateOpen(false);
      setNewTitle("");
      navigate(`/instructor/courses/${res._id}/edit`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Could not create course");
    },
  });

  const drafts = courses?.filter((c) => !c.active) ?? [];
  const published = courses?.filter((c) => c.active) ?? [];

  const handleShare = (course: Course) => {
    const url = `${window.location.origin}/courses/${course._id}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy"),
    );
  };

  const handleRemoveTag = (courseId: string, tag: string) => {
    const course = courses?.find((c) => c._id === courseId);
    if (!course) return;
    const next = (course.tags ?? []).filter((t) => t !== tag);
    removeTagMutation.mutate({ id: courseId, tags: next });
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading courses...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto pb-28">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">My Courses</h1>
            <p className="text-slate-500 text-sm">Manage your course content and student accessibility.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors",
                viewMode === "kanban" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50",
              )}
              title="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors",
                viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50",
              )}
              title="List view"
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search courses by name…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {!courses?.length ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-500 mb-2 font-medium">
            {debouncedSearch ? "No courses match your search." : "You haven't created any courses yet."}
          </p>
          {!debouncedSearch && (
            <p className="text-slate-400 text-sm">Use the + button to create a course.</p>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4 px-1">Draft</h2>
            <div className="space-y-4 min-h-[120px]">
              {drafts.map((course) => (
                <CourseAdminCard
                  key={course._id}
                  course={course}
                  viewMode="kanban"
                  onRemoveTag={handleRemoveTag}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onToggleActive={(id, active) => toggleMutation.mutate({ id, active })}
                  onShare={handleShare}
                  deletePending={deleteMutation.isPending}
                  togglePending={toggleMutation.isPending}
                  removeTagPending={removeTagMutation.isPending}
                />
              ))}
              {drafts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-12 text-center text-sm text-slate-400 font-medium">
                  No draft courses
                </div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4 px-1">Published</h2>
            <div className="space-y-4 min-h-[120px]">
              {published.map((course) => (
                <CourseAdminCard
                  key={course._id}
                  course={course}
                  viewMode="kanban"
                  onRemoveTag={handleRemoveTag}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onToggleActive={(id, active) => toggleMutation.mutate({ id, active })}
                  onShare={handleShare}
                  deletePending={deleteMutation.isPending}
                  togglePending={toggleMutation.isPending}
                  removeTagPending={removeTagMutation.isPending}
                />
              ))}
              {published.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-12 text-center text-sm text-slate-400 font-medium">
                  No published courses
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses?.map((course) => (
            <CourseAdminCard
              key={course._id}
              course={course}
              viewMode="list"
              onRemoveTag={handleRemoveTag}
              onDelete={(id) => deleteMutation.mutate(id)}
              onToggleActive={(id, active) => toggleMutation.mutate({ id, active })}
              onShare={handleShare}
              deletePending={deleteMutation.isPending}
              togglePending={toggleMutation.isPending}
              removeTagPending={removeTagMutation.isPending}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-8 left-4 z-20 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 flex items-center justify-center transition-all hover:scale-105 md:left-68"
        title="Create course"
      >
        <Plus className="w-7 h-7" />
      </button>

      {createOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-course-title"
          onClick={() => !createMutation.isPending && setCreateOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="create-course-title" className="text-xl font-black text-slate-900">
                Create Course
              </h2>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => setCreateOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const t = newTitle.trim();
                if (!t) return;
                createMutation.mutate(t);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Provide a name… (e.g. Basics of Odoo CRM)"
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 font-bold placeholder:text-slate-300"
              />
              <p className="text-xs text-slate-500">You can add details, tags, and media after saving.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={() => setCreateOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !newTitle.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
