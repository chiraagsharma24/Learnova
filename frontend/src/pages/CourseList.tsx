import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Edit2, Trash2, Search,
    Eye, FileText, Users, MessageSquare,
    MoreVertical, MoreHorizontal
} from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAdminCourses, deleteCourse, updateCourse } from "../api";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

export function CourseList() {
    const queryClient = useQueryClient();
    const { data: courses, isLoading } = useQuery({
        queryKey: ["admin-courses"],
        queryFn: fetchAdminCourses,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
            toast.success("Course deleted");
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, active }: { id: string, active: boolean }) => updateCourse(id, { active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
            toast.success("Visibility updated");
        },
    });

    if (isLoading) return <div className="p-8 text-slate-500">Loading courses...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-1">My Courses</h1>
                    <p className="text-slate-500 text-sm">Manage your course content and student accessibility.</p>
                </div>
                <Link
                    to="/instructor/courses/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                    <Plus className="w-4 h-4" /> New Course
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {courses?.map((course) => (
                    <div key={course._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center">
                        <div className="w-full md:w-48 h-32 md:h-28 bg-slate-100 shrink-0">
                            {course.image && <img src={course.image} className="w-full h-full object-cover" />}
                        </div>

                        <div className="p-5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-900 truncate">{course.title}</h3>
                                <span className={cn(
                                    "text-[10px] uppercase font-black px-1.5 py-0.5 rounded",
                                    course.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                                )}>
                                    {course.active ? "Active" : "Draft"}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.learnerCount} students</span>
                                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {course.reviewCount} reviews</span>
                                <span className="flex items-center gap-1">Visibility: {course.visibility}</span>
                            </div>
                        </div>

                        <div className="p-5 md:pl-0 flex items-center gap-2">
                            <Link
                                to={`/instructor/courses/${course._id}`}
                                className="bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 p-2.5 rounded-xl transition-colors"
                                title="Manage Lessons"
                            >
                                <FileText className="w-4 h-4" />
                            </Link>
                            <Link
                                to={`/instructor/courses/${course._id}/edit`}
                                className="bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 p-2.5 rounded-xl transition-colors"
                                title="Edit Info"
                            >
                                <Edit2 className="w-4 h-4" />
                            </Link>
                            <div className="h-6 w-px bg-slate-100 mx-1" />
                            <button
                                onClick={() => toggleMutation.mutate({ id: course._id, active: !course.active })}
                                className={cn(
                                    "p-2.5 rounded-xl transition-colors",
                                    course.active ? "bg-white text-emerald-500 hover:bg-emerald-50 border border-emerald-100" : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
                                )}
                                title={course.active ? "Hide Course" : "Publish Course"}
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { if (confirm("Are you sure?")) deleteMutation.mutate(course._id) }}
                                className="bg-white text-rose-400 hover:bg-rose-50 border border-rose-100 p-2.5 rounded-xl transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {courses?.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-500 mb-6 font-medium">You haven't created any courses yet.</p>
                        <Link
                            to="/instructor/courses/new"
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                        >
                            Create your first course
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
