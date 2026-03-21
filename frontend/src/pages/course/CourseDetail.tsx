import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Users,
  Star,
  Play,
  FileText,
  Image,
  HelpCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";
import { fetchCourse, recordCourseView } from "@/fetchers/course";
import { checkEnrollment } from "@/fetchers/enrollment";
import { enrollInCourse } from "@/fetchers/enrollment";
import { fetchCourseProgress } from "@/fetchers/progress";
import { cn } from "@/lib/utils";

const typeIcon = {
  video: Play,
  document: FileText,
  image: Image,
  quiz: HelpCircle,
};

export function CourseDetail() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id),
  });

  useEffect(() => {
    if (!course || !id || !course.active) return;
    const key = `ln_course_view_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    recordCourseView(id).catch(() => {});
  }, [course, id]);

  const { data: enrollmentData } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: () => checkEnrollment(id),
    enabled: !!user,
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", id],
    queryFn: () => fetchCourseProgress(id),
    enabled: !!enrollmentData?.enrolled,
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollInCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      toast.success("Successfully enrolled!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Enrollment failed");
    },
  });

  if (isLoading || !course) return <div className="p-8 text-center">Loading course...</div>;

  const isEnrolled = enrollmentData?.enrolled;
  const progressPercent = enrollmentData?.enrollment?.completionPercentage || 0;

  const handleStartLearning = () => {
    if (!isEnrolled) {
      if (!user) {
        navigate("/login");
        return;
      }
      enrollMutation.mutate();
    } else if (course.lessons && course.lessons.length > 0) {
      navigate(`/courses/${id}/learn/${course.lessons[0]._id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" /> Back to courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left column: Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-10 text-center flex items-center justify-center p-0">
            {course.image ? (
              <img src={course.image} alt={course.title} className="w-full h-80 object-cover" />
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-white/50" />
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{course.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 mb-8">
            <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
              By {course.instructorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {course.learnerCount} students
            </span>
            <span className="flex items-center gap-1.5 text-amber-500 font-medium">
              <Star className="w-4 h-4 fill-amber-500" /> {course.reviewCount} reviews
            </span>
          </div>

          <div className="prose prose-slate max-w-none mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">About this course</h2>
            <div dangerouslySetInnerHTML={{ __html: course.description }} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center justify-between">
              Course Content
              <span className="text-sm font-normal text-slate-500">{course.lessons?.length || 0} lessons</span>
            </h2>

            <div className="space-y-3">
              {course.lessons?.map((lesson, idx) => {
                const Icon = typeIcon[lesson.type as keyof typeof typeIcon] || Play;
                const isCompleted = progress?.some((p) => p.lessonId === lesson._id && p.completed);
                const canAccess = isEnrolled;

                return (
                  <div
                    key={lesson._id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      isCompleted ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100",
                      canAccess ? "hover:border-indigo-200" : "opacity-75",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-500",
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800 flex items-center gap-2">
                          {lesson.title}
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                        </h4>
                        <p className="text-xs text-slate-500 capitalize">
                          {lesson.type} • {lesson.duration || 5} min
                        </p>
                      </div>
                    </div>
                    {canAccess ? (
                      <Link
                        to={`/courses/${id}/learn/${lesson._id}`}
                        className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 mr-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Sticky card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sticky top-28">
            <div className="mb-6">
              {isEnrolled ? (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-slate-500">Your progress</span>
                    <span className="text-xl font-bold text-indigo-600">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-3xl font-bold text-slate-900">Free</div>
              )}
            </div>

            <button
              onClick={handleStartLearning}
              disabled={enrollMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group mb-6"
            >
              {isEnrolled ? (
                <>
                  Continue Learning <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              ) : enrollMutation.isPending ? (
                "Enrolling..."
              ) : (
                "Enroll for Free"
              )}
            </button>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800">This course includes:</h4>
              <ul className="space-y-3">
                {[
                  {
                    icon: Play,
                    text: `${course.lessons?.filter((l) => l.type === "video").length || 0} Video lessons`,
                  },
                  { icon: HelpCircle, text: `${course.lessons?.filter((l) => l.type === "quiz").length || 0} Quizzes` },
                  { icon: FileText, text: "Course materials" },
                  { icon: CheckCircle2, text: "Certificate of completion" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <item.icon className="w-4 h-4 text-indigo-500" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
