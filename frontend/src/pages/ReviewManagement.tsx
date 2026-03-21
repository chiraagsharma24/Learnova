import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, MessageSquare, Star, ChevronLeft, FileText, PieChart, Trash2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import { fetchCourse } from "@/fetchers/course";
import { fetchAllCourseReviews, approveReview, deleteReview } from "@/fetchers/review";
import { cn } from "@/lib/utils";

export function ReviewManagement() {
  const { id: courseId } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse(courseId),
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", courseId],
    queryFn: () => fetchAllCourseReviews(courseId),
  });

  const approveMutation = useMutation({
    mutationFn: approveReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", courseId] });
      toast.success("Review approved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(courseId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", courseId] });
      toast.success("Review deleted");
    },
  });

  if (isLoading) return <div className="p-8 text-slate-500">Loading reviews...</div>;

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-slate-100 p-8">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Courses
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-800">{course?.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-8">
            {[
              { label: "Lessons", to: `/instructor/courses/${courseId}`, icon: FileText },
              { label: "Attendees", to: `/instructor/courses/${courseId}/attendees`, icon: Users },
              { label: "Reviews", to: `/instructor/courses/${courseId}/reviews`, active: true, icon: MessageSquare },
              { label: "Reports", to: `/instructor/courses/${courseId}/reports`, icon: PieChart },
            ].map((tab) => (
              <Link
                key={tab.label}
                to={tab.to}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  tab.active
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-100",
                )}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 flex-1">
        <div className="max-w-5xl mx-auto space-y-4">
          {reviews?.map((review: any) => (
            <div
              key={review._id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                    {review.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{review.user.name}</div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn("w-3 h-3", i < review.rating ? "fill-amber-500" : "text-slate-200")}
                        />
                      ))}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "ml-auto text-[9px] uppercase font-black px-2 py-0.5 rounded-full",
                      review.approved
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600 border border-amber-100",
                    )}
                  >
                    {review.approved ? "Live" : "Pending Approval"}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">"{review.comment}"</p>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6 shrink-0">
                {!review.approved && (
                  <button
                    onClick={() => approveMutation.mutate({ courseId, reviewId: review._id })}
                    className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" /> Approve
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Delete review?")) deleteMutation.mutate(review._id);
                  }}
                  className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
          {reviews?.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-dashed border-slate-200">
              No reviews for this course yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
