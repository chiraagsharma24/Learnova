import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, User, Mail, Lock, School } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "learner" as "learner" | "instructor",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error("Please fill in all fields");
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      toast.success("Account created successfully!");
      if (formData.role === "instructor") navigate("/instructor/reporting");
      else navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Learnova</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create an account</h1>
          <p className="text-slate-500 font-medium">Join our community of lifelong learners and master new skills.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-[0.03]">
            <GraduationCap className="w-40 h-40 text-indigo-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "learner" })}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                  formData.role === "learner"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-widest">Learner</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "instructor" })}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                  formData.role === "instructor"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                }`}
              >
                <School className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-widest">Instructor</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600/20 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                    placeholder="Enter your name"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600/20 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                    placeholder="name@company.com"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600/20 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                    placeholder="••••••••"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale group"
            >
              {loading ? "Creating Account..." : "Start Learning Free"}{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-10 text-center text-slate-500 font-bold text-sm">
            Already registered?{" "}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
