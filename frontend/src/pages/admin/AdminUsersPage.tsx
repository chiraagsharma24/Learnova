import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchAdminUserList, patchAdminUser } from "@/fetchers/user";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RoleFilter = "" | "learner" | "instructor" | "admin";

export interface AdminUserRow {
  userId: string;
  name: string;
  email: string;
  role: "learner" | "instructor" | "admin";
  blocked: boolean;
  createdAt?: string;
}

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => fetchAdminUserList(roleFilter || undefined),
  });

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [rows],
  );

  const mutation = useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string;
      body: { blocked?: boolean; role?: "learner" | "instructor" | "admin" };
    }) => patchAdminUser(userId, body),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Update failed"),
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Users</h1>
        <p className="text-slate-500 text-sm mt-1">Learners and instructors across the platform.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
        >
          <option value="">All</option>
          <option value="learner">Learner</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((u: AdminUserRow) => {
                  const isSelf = me?.userId === u.userId;
                  const blocked = Boolean(u.blocked);
                  return (
                    <tr key={u.userId} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={u.email}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf || mutation.isPending}
                          onChange={(e) => {
                            const next = e.target.value as AdminUserRow["role"];
                            if (next === u.role) return;
                            mutation.mutate({ userId: u.userId, body: { role: next } });
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold disabled:opacity-50"
                        >
                          <option value="learner">Learner</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                            blocked ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800",
                          )}
                        >
                          {blocked ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg font-bold text-xs"
                          disabled={isSelf || mutation.isPending}
                          onClick={() =>
                            mutation.mutate({ userId: u.userId, body: { blocked: !blocked } })
                          }
                        >
                          {blocked ? "Unblock" : "Block"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <p className="py-12 text-center text-slate-500 text-sm">No users match this filter.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
