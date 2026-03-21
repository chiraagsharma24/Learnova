import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, LogOut, Menu, X, GraduationCap, ShieldCheck } from "lucide-react";

import { useAuth } from "@AuthContent";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <GraduationCap className="w-7 h-7" />
          Learnova
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/courses"
            className="text-slate-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Courses
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="text-slate-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
          {user && (user.role === "admin" || user.role === "instructor") && (
            <Link
              to="/instructor/dashboard"
              className="text-slate-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Backoffice
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 space-y-2">
          <Link to="/courses" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-700">
            Courses
          </Link>
          {user && (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-700">
              Dashboard
            </Link>
          )}
          {user && (user.role === "admin" || user.role === "instructor") && (
            <Link
              to="/instructor/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-slate-700"
            >
              Backoffice
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-red-500">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-indigo-600">
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-indigo-600">
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
