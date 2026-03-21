import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

interface Props {
  children?: ReactNode;
}

export function PublicLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Outlet />
      <main>{children}</main>
    </div>
  );
}
