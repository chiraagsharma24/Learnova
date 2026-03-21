import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Users", icon: Users, to: "/admin/users" },
  { label: "Courses", icon: BookOpen, to: "/admin/courses" },
  { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 min-h-screen bg-slate-900 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-white font-bold text-lg">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            Learnova
          </Link>
          <p className="text-slate-400 text-xs mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-2">
          {user && (
            <p className="px-3 text-[11px] text-slate-500 truncate" title={user.email}>
              {user.name}
            </p>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
          <Link
            to="/courses"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors px-3 py-2"
          >
            <ChevronLeft className="w-4 h-4" /> Public catalog
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
