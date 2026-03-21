import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Shield, GraduationCap, PlayCircle } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 opacity-40">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-indigo-100 animate-fade-in shadow-sm">
            <Trophy className="w-3.5 h-3.5" /> Learnova 2.0 is logic-driven
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
            Master Any Skill with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Gamified Learning
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-500 mb-12 leading-relaxed">
            The all-in-one platform for instructors to build immersive courses and for learners to earn badges while
            mastering new concepts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={
                user
                  ? user.role === "instructor"
                    ? "/instructor/reporting"
                    : user.role === "admin"
                      ? "/admin/dashboard"
                      : "/courses"
                  : "/register"
              }
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95"
            >
              {user
                ? user.role === "admin"
                  ? "Admin dashboard"
                  : user.role === "instructor"
                    ? "Open Backoffice"
                    : "Continue Learning"
                : "Start Free Trial"}{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/courses"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95"
            >
              Browse Catalog
            </Link>
          </div>

          <div className="mt-20 relative px-4">
            <div className="bg-slate-900 rounded-[2.5rem] p-4 shadow-3xl max-w-5xl mx-auto border-8 border-slate-800 ring-1 ring-slate-700 shadow-indigo-100">
              <div className="aspect-video bg-slate-800 rounded-[1.5rem] flex items-center justify-center relative group cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20" />
                <PlayCircle className="w-24 h-24 text-white/40 group-hover:text-white/100 group-hover:scale-110 transition-all z-10 drop-shadow-2xl" />
                <div className="absolute bottom-6 left-6 text-left">
                  <div className="text-white font-black text-lg">Product Walkthrough</div>
                  <div className="text-white/60 text-sm">See how Learnova revolutionizes e-learning</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Built for modern education</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Everything you need to deliver high-impact educational content at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Immersive Player",
                desc: "Video, documents, and interactive quizzes in a distraction-free environment.",
                icon: PlayCircle,
                color: "bg-blue-500",
              },
              {
                title: "Gamification Engine",
                desc: "Earn points and unlock badges like Explorer, Achiever, and Specialist.",
                icon: Trophy,
                color: "bg-amber-500",
              },
              {
                title: "Instructor Tools",
                desc: "Powerful backoffice to manage lessons, quizzes, and track student progress.",
                icon: Shield,
                color: "bg-indigo-500",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg", f.color)}>
                  <f.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale contrast-125">
            <span className="text-2xl font-black italic tracking-tighter">UNIVERSITY</span>
            <span className="text-2xl font-black italic tracking-tighter">TECHLEARN</span>
            <span className="text-2xl font-black italic tracking-tighter">SKILLHUB</span>
            <span className="text-2xl font-black italic tracking-tighter">EDUCORE</span>
            <span className="text-2xl font-black italic tracking-tighter">MASTERY</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />

        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
            Ready to transform your <br /> learning experience?
          </h2>
          <p className="text-indigo-100 text-xl mb-12 font-medium">
            Join 50,000+ students and instructors on the most advanced e-learning platform.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
          >
            Get Started for Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="py-12 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <GraduationCap className="w-7 h-7 text-indigo-400" />
            Learnova
          </div>
          <div className="flex gap-8 text-slate-400 text-sm font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Courses
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
          </div>
          <p className="text-slate-500 text-xs font-medium">© 2026 Learnova Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
