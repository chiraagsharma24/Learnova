import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
  Settings2,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
            className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1.5",
              location.pathname.startsWith("/courses") ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600",
            )}
          >
            <BookOpen className="w-4 h-4" /> Courses
          </Link>
          {user && user.role !== "admin" && (
            <Link
              to="/dashboard"
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1.5",
                location.pathname === "/dashboard" ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600",
              )}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
          {user?.role === "learner" && (
            <Link
              to="/mentorship"
              className="text-slate-600 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4" /> Mentorship
            </Link>
          )}
          {user?.role === "instructor" && (
            <Link
              to="/instructor/reporting"
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1.5",
                location.pathname.startsWith("/instructor") ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600",
              )}
            >
              <ShieldCheck className="w-4 h-4" /> Backoffice
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link
              to="/admin/dashboard"
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1.5",
                location.pathname.startsWith("/admin") ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600",
              )}
            >
              <Settings2 className="w-4 h-4" /> Admin
            </Link>
          )}
          {user ? (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="cursor-pointer hover:ring-2 ring-foreground/20 transition-all">
                    {/*<AvatarImage src={session?.user.image ?? ""} alt="profile" />*/}
                    <AvatarFallback className="font-bold">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-2xl p-6 shadow-2xl border-border/50" align="end">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        {/*<AvatarImage src={session?.user.image ?? ""} alt="profile" />*/}
                        <AvatarFallback className="text-lg font-bold">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold leading-none mb-1">{user.name}</h3>
                        <p className="text-sm text-muted-foreground leading-none">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <Button
                        variant={"outline"}
                        className="rounded-xl font-bold text-destructive hover:bg-destructive/5 hover:text-destructive"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
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
          {user && user.role !== "admin" && (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-700">
              Dashboard
            </Link>
          )}
          {user?.role === "learner" && (
            <Link to="/mentorship" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-700">
              Mentorship
            </Link>
          )}
          {user?.role === "instructor" && (
            <Link
              to="/instructor/reporting"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-slate-700"
            >
              Backoffice
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-700">
              Admin
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
