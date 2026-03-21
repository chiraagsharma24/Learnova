import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { fetchAdminCourses, updateCourse, deleteCourse } from "@/fetchers/course";
import type { Course } from "@/types/course";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-platform-courses", debounced],
    queryFn: () => fetchAdminCourses(debounced),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCourse(id, { active }),
    onSuccess: () => {
      toast.success("Course updated");
      queryClient.invalidateQueries({ queryKey: ["admin-platform-courses"] });
    },
    onError: () => toast.error("Could not update course"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-platform-courses"] });
    },
    onError: () => toast.error("Could not delete course"),
  });

  const handleDelete = (c: Course) => {
    if (!window.confirm(`Delete “${c.title}”? This cannot be undone.`)) return;
    deleteMutation.mutate(c._id);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Courses</h1>
        <p className="text-slate-500 text-sm mt-1">All courses on the platform — publish, unpublish, or remove.</p>
      </header>

      <input
        type="search"
        placeholder="Search by title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm"
      />

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading courses…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Lessons</th>
                  <th className="px-4 py-3 text-right">Duration (min)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c: Course) => (
                  <tr key={c._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-[220px] truncate" title={c.title}>
                      {c.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.instructorName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                          c.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700",
                        )}
                      >
                        {c.active ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c.viewCount ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c.lessonCount ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {c.totalDurationMinutes != null ? Math.round(c.totalDurationMinutes) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs font-bold h-8"
                          disabled={toggleMutation.isPending}
                          onClick={() =>
                            toggleMutation.mutate({ id: c._id, active: !c.active })
                          }
                        >
                          {c.active ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs font-bold h-8"
                          asChild
                        >
                          <Link to={`/courses/${c._id}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs font-bold h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {courses.length === 0 && (
              <p className="py-12 text-center text-slate-500 text-sm">No courses found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
