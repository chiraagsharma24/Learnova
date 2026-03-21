import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen } from "lucide-react";
import { fetchCourses } from "@/fetchers/course";
import { CourseCard } from "@/pages/course";

export function CourseCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", searchTerm],
    queryFn: () => fetchCourses(searchTerm),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Explore Courses</h1>
          <p className="text-slate-600">
            Start your learning journey with our curated selection of high-quality courses designed for your success.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>
          {/*<button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </button>*/}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse">
              <div className="aspect-video bg-slate-100 rounded-xl mb-4" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No courses found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
