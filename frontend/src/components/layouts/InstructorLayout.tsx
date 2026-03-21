import { NavLink, Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
    LayoutDashboard, BookOpen, GraduationCap,
    ChevronLeft
} from "lucide-react";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/instructor/dashboard" },
    { label: "My Courses", icon: BookOpen, to: "/instructor/courses" },
];

export function InstructorLayout() {
    return (
        <div className="flex h-screen bg-slate-50">
            <aside className="w-60 min-h-screen bg-slate-900 flex flex-col">
                <div className="p-5 border-b border-slate-700">
                    <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
                        <GraduationCap className="w-6 h-6 text-indigo-400" />
                        Learnova
                    </Link>
                    <p className="text-slate-400 text-xs mt-0.5">Backoffice</p>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map(({ label, icon: Icon, to }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                )
                            }
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-3 border-t border-slate-700">
                    <Link to="/courses" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors px-3 py-2">
                        <ChevronLeft className="w-4 h-4" /> Back to Site
                    </Link>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-h-screen overflow-auto">
                <Outlet />
            </div>
        </div>
    );
}
