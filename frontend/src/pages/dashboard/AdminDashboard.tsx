import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, BookOpen, GraduationCap, Check, X, Clock, BarChart3, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { fetchAdminStats } from "@/fetchers/report";
import { fetchInstructorRequests, approveInstructorRequest, rejectInstructorRequest } from "@/fetchers/user";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
    const queryClient = useQueryClient();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: fetchAdminStats,
    });

    const { data: requests, isLoading: requestsLoading } = useQuery({
        queryKey: ["instructor-requests"],
        queryFn: fetchInstructorRequests,
    });

    const approveMutation = useMutation({
        mutationFn: approveInstructorRequest,
        onSuccess: () => {
            toast.success("Instructor request approved!");
            queryClient.invalidateQueries({ queryKey: ["instructor-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        },
        onError: () => toast.error("Failed to approve request"),
    });

    const rejectMutation = useMutation({
        mutationFn: rejectInstructorRequest,
        onSuccess: () => {
            toast.success("Instructor request rejected");
            queryClient.invalidateQueries({ queryKey: ["instructor-requests"] });
        },
        onError: () => toast.error("Failed to reject request"),
    });

    if (statsLoading || requestsLoading) {
        return <div className="p-8 text-slate-500 font-medium animate-pulse text-center mt-20">Gathering system intelligence...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <pre className="text-[10px] bg-slate-100 p-2 rounded">DEBUG: {JSON.stringify(stats)}</pre>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">System Overview</h1>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">
                        Welcome to the command center. Monitor platform growth and manage instructor applications.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-700 font-bold text-sm shadow-sm whitespace-nowrap overflow-hidden">
                    <TrendingUp className="w-4 h-4" /> Platform is healthy & growing
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Students", value: stats?.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Total Instructors", value: stats?.totalInstructors, icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Courses Published", value: stats?.totalCourses, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Course Enrollments", value: stats?.totalEnrollments, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group">
                        <div className={cn(item.bg, item.color, "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500")}>
                            <item.icon className="w-7 h-7" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{item.value || 0}</div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Instructor Requests */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs">Instructor Requests</h3>
                            <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {requests?.length || 0} Pending
                            </span>
                        </div>
                        <div className="p-2">
                            {requests && requests.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {requests.map((request: any) => (
                                        <div key={request.userId} className="p-8 hover:bg-slate-50/50 transition-all rounded-[2rem] group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-slate-50">
                                                        {request.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-xl mb-1">{request.name}</h4>
                                                        <p className="text-slate-400 font-bold text-sm tracking-tight">{request.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => approveMutation.mutate(request.userId)}
                                                        disabled={approveMutation.isPending}
                                                        className="bg-emerald-500/10 text-emerald-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
                                                    >
                                                        <Check className="w-4 h-4" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => rejectMutation.mutate(request.userId)}
                                                        disabled={rejectMutation.isPending}
                                                        className="bg-rose-500/10 text-rose-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
                                                    >
                                                        <X className="w-4 h-4" /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                                        <Check className="w-10 h-10" />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-lg mb-1">Queue is Clear</h4>
                                    <p className="text-slate-400 font-medium">No pending instructor requests at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Mini Sidebar */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <TrendingUp className="w-40 h-40" />
                        </div>
                        <div className="relative">
                            <h3 className="text-[10px] font-black mb-8 uppercase tracking-[0.3em] text-indigo-400">Latest Enrollments</h3>
                            <div className="space-y-6">
                                {stats?.enrollmentActivity?.map((activity: any, i: number) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0 group-hover:scale-150 transition-transform" />
                                        <div>
                                            <div className="font-bold text-sm text-white/90 leading-tight">
                                                <span className="text-indigo-400">{activity.studentName}</span> enrolled in{" "}
                                                <span className="text-white">{activity.courseTitle}</span>
                                            </div>
                                            <div className="text-[10px] text-white/40 font-black uppercase mt-1">
                                                {new Date(activity.enrolledAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-[10px] font-black mb-8 uppercase tracking-[0.3em] text-slate-400">Newly Published</h3>
                        <div className="space-y-6">
                            {stats?.latestCourses?.map((course: any) => (
                                <div key={course._id} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                        {course.image && <img src={course.image} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{course.title}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-2 mt-0.5">
                                            <Clock className="w-3 h-3" /> {new Date(course.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
