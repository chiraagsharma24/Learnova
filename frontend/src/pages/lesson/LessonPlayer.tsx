import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  FileText,
  Image,
  HelpCircle,
  CheckCircle2,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  Maximize,
} from "lucide-react";
import ReactPlayer from "react-player";
// import toast from "react-hot-toast";

import { fetchCourse } from "@/fetchers/course";
import { fetchLesson } from "@/fetchers/lesson";
import { fetchCourseProgress, completeLesson } from "@/fetchers/progress";
// import { fetchReviews, submitReview } from "@/fetchers/review";
import { QuizPlayer } from "@/components/QuizPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const typeIcon = {
  video: Play,
  document: FileText,
  image: Image,
  quiz: HelpCircle,
};

export function LessonPlayer() {
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string };
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse(courseId),
  });

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(courseId, lessonId),
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", courseId],
    queryFn: () => fetchCourseProgress(courseId),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeLesson(lessonId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", courseId] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] });
    },
  });

  const isCompleted = progress?.some((p) => p.lessonId === lessonId && p.completed);

  useEffect(() => {
    if (lesson && lesson.type !== "quiz" && !isCompleted) {
      // Auto-complete simple lessons after 5 seconds
      const timer = setTimeout(() => {
        completeMutation.mutate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lessonId, isCompleted]);

  if (isLoading || !lesson) return <div className="h-screen flex items-center justify-center">Loading lesson...</div>;

  const lessons = course?.lessons || [];
  const currentIdx = lessons.findIndex((l) => l._id === lessonId);
  const prevLesson = lessons[currentIdx - 1];
  const nextLesson = lessons[currentIdx + 1];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-slate-50 border-r border-slate-200 transition-all duration-300 flex flex-col overflow-hidden",
          sidebarOpen ? "w-80" : "w-0",
        )}
      >
        <div className="p-6 border-b border-slate-200 bg-white">
          <Link
            to={`/courses/${courseId}`}
            className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2 group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to course
          </Link>
          <h2 className="font-bold text-slate-800 line-clamp-2">{course?.title}</h2>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {lessons.map((l, idx) => {
            const Icon = typeIcon[l.type as keyof typeof typeIcon] || Play;
            const completed = progress?.some((p) => p.lessonId === l._id && p.completed);
            const active = l._id === lessonId;

            return (
              <NavLink
                key={l._id}
                to={`/courses/${courseId}/learn/${l._id}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl text-sm transition-all group",
                  active
                    ? "bg-white border border-slate-200 shadow-sm text-indigo-600 font-bold"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    completed
                      ? "bg-emerald-100 text-emerald-600"
                      : active
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-200 text-slate-400 group-hover:bg-slate-300",
                  )}
                >
                  {completed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Lesson {idx + 1}</div>
                  <div className="truncate">{l.title}</div>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-4 top-4 z-10 p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-200 rounded-lg hover:bg-white transition-all overflow-hidden"
        >
          {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {lesson.type === "video" && (
            <div className="aspect-video bg-black w-full flex items-center justify-center group overflow-hidden">
              {lesson.videoUrl ? (
                <ReactPlayer
                  url={lesson.videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  onEnded={() => completeMutation.mutate()}
                />
              ) : (
                <div className="text-white flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                  <p className="font-bold">Video not available</p>
                </div>
              )}
            </div>
          )}

          {lesson.type === "document" && (
            <div className="max-w-4xl mx-auto p-8 md:p-16">
              <div className="mb-10 text-center">
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                  Study Document
                </span>
                <h1 className="text-4xl font-black text-slate-800 leading-tight">{lesson.title}</h1>
              </div>
              {lesson.documentUrl?.endsWith(".pdf") ? (
                <iframe
                  src={lesson.documentUrl}
                  className="w-full h-[800px] rounded-3xl border border-slate-200 shadow-xl"
                />
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 prose prose-indigo max-w-none">
                  <p className="leading-relaxed text-slate-600 text-lg">
                    Browse the document at:{" "}
                    <a href={lesson.documentUrl} target="_blank" className="text-indigo-600 font-bold underline">
                      {lesson.documentUrl}
                    </a>
                  </p>
                  <div className="mt-8 p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center">
                    <FileText className="w-16 h-16 text-slate-300 mb-4" />
                    <h4 className="font-bold text-slate-500">Document View Placeholder</h4>
                  </div>
                </div>
              )}
            </div>
          )}

          {lesson.type === "image" && (
            <div className="max-w-5xl mx-auto p-8 md:px-12 flex flex-col items-center">
              <div className="mb-8 w-full">
                <h1 className="text-3xl font-black text-slate-800 mb-2">{lesson.title}</h1>
                <p className="text-slate-500">Visual study material</p>
              </div>
              <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-indigo-100 max-w-full">
                <img src={lesson.imageUrl} alt={lesson.title} className="max-w-full h-auto" />
              </div>
            </div>
          )}

          {lesson.type === "quiz" && lesson.quiz && (
            <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-white to-slate-50">
              <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-50 overflow-hidden">
                <QuizPlayer quiz={lesson.quiz} courseId={courseId} lessonId={lessonId} onComplete={() => {}} />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="h-20 border-t border-slate-200 px-8 flex items-center justify-between bg-white/80 backdrop-blur">
          <div className="flex gap-4">
            {prevLesson ? (
              <Link
                to={`/courses/${courseId}/learn/${prevLesson._id}`}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors p-2"
              >
                <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
              </Link>
            ) : (
              <div className="w-20" />
            )}
          </div>

          <div className="hidden md:flex flex-col items-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In progress</div>
            <div className="font-bold text-indigo-600">
              {currentIdx + 1} of {lessons.length} Lessons
            </div>
          </div>

          <div className="flex gap-4">
            {nextLesson ? (
              <Link
                to={`/courses/${courseId}/learn/${nextLesson._id}`}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                Next <span className="hidden sm:inline">Lesson</span> <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                Finish Course <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
