import { Link } from "react-router-dom";
import { Users, Star, BookOpen, Clock, Play, FileText, Image, HelpCircle } from "lucide-react";
import type { Course } from "../api";

const typeIcon: Record<string, React.ReactNode> = {
    video: <Play className="w-3 h-3" />,
    document: <FileText className="w-3 h-3" />,
    image: <Image className="w-3 h-3" />,
    quiz: <HelpCircle className="w-3 h-3" />,
};

interface CourseCardProps {
    course: Course;
    href?: string;
    showProgress?: boolean;
    progress?: number;
}

export function CourseCard({ course, href, showProgress, progress = 0 }: CourseCardProps) {
    const link = href || `/courses/${course._id}`;

    return (
        <Link to={link} className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all duration-200 hover:-translate-y-0.5">
            <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                {course.image ? (
                    <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-indigo-300" />
                    </div>
                )}
                {!course.active && (
                    <span className="absolute top-2 right-2 bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full">Inactive</span>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1">{course.title}</h3>
                <p className="text-xs text-slate-500 mb-3">by {course.instructorName}</p>

                {showProgress && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span className="font-medium text-indigo-600">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500">
                    {course.learnerCount !== undefined && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {course.learnerCount}
                        </span>
                    )}
                    {course.reviewCount !== undefined && (
                        <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" /> {course.reviewCount}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
