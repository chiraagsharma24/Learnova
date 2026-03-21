import { useQuery } from "@tanstack/react-query";
import {
    Users, BookOpen, Star, TrendingUp,
    Plus, Calendar, Mail, CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAdminCourses } from "../api";
import { cn } from "../lib/utils";

export function InstructorDashboard() {
    const { data: courses, isLoading } = useQuery({
        queryKey: ["admin-courses"],
        queryFn: fetchAdminCourses,
    });

    if (isLoading) return <div className="p-8 text-slate-500">Loading dashboard...</div>;

    const totalCourses = courses?.length || 0;
    const activeCourses = courses?.filter(c => c.active).length || 0;
    const totalLearners = courses?.reduce((acc, curr) => acc + (curr.learnerCount || 0), 0) || 0;
    const totalReviews = courses?.reduce((acc, curr) => acc + (curr.reviewCount || 0), 0) || 0;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-1">Instructor Dashboard</h1>
                    <p className="text-slate-500 text-sm">Monitor your platform performance and student engagement.</p>
                </div>
                <Link
                    to="/instructor/courses/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                    <Plus className="w-4 h-4" /> Create Course
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: "Total Students", value: totalLearners, icon: Users, color: "bg-blue-50 text-blue-600" },
                    { label: "Active Courses", value: activeCourses, icon: BookOpen, color: "bg-emerald-50 text-emerald-600" },
                    { label: "Total Reviews", value: totalReviews, icon: Star, color: "bg-amber-50 text-amber-600" },
                    { label: "Avg. Completion", value: "72%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 font-black", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-10">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Your Recent Courses</h3>
                    <Link to="/instructor/courses" className="text-xs font-black text-indigo-600 uppercase hover:underline">View All</Link>
                </div>
                <div className="divide-y divide-slate-50">
                    {courses?.slice(0, 5).map((course) => (
                        <div key={course._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                    {course.image && <img src={course.image} className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{course.title}</h4>
                                    <p className="text-xs text-slate-500">{course.learnerCount} learners • Created {new Date(course.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Link
                                to={`/instructor/courses/${course._id}`}
                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <TrendingUp className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}
                    {courses?.length === 0 && (
                        <div className="p-12 text-center text-slate-400 text-sm">No courses yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
