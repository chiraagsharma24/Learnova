import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CircleDashed,
  Loader2,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { fetchInstructorOverview } from "@/fetchers/report";
import type { InstructorReportRow, LearnerProgressStatus } from "@/types/instructor";
import { cn } from "@/lib/utils";

const COLUMN_STORAGE_KEY = "learnova_instructor_report_columns";

type ColumnKey =
  | "sr"
  | "courseName"
  | "participantName"
  | "enrolledAt"
  | "startDate"
  | "timeSpent"
  | "completion"
  | "completedDate"
  | "status";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "sr", label: "Sr no." },
  { key: "courseName", label: "Course name" },
  { key: "participantName", label: "Participant name" },
  { key: "enrolledAt", label: "Enrolled date" },
  { key: "startDate", label: "Start date" },
  { key: "timeSpent", label: "Time spent" },
  { key: "completion", label: "Completion %" },
  { key: "completedDate", label: "Completed date" },
  { key: "status", label: "Status" },
];

function loadColumnVisibility(): Record<ColumnKey, boolean> {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) {
      return Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>;
    }
    const parsed = JSON.parse(raw) as Partial<Record<ColumnKey, boolean>>;
    const next = { ...Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true])) };
    for (const k of ALL_COLUMNS) {
      if (typeof parsed[k.key] === "boolean") next[k.key] = parsed[k.key]!;
    }
    return next as Record<ColumnKey, boolean>;
  } catch {
    return Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>;
  }
}

function saveColumnVisibility(v: Record<ColumnKey, boolean>) {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(v));
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

function statusLabel(s: LearnerProgressStatus) {
  if (s === "completed") return "Completed";
  if (s === "yet_to_start") return "Yet to Start";
  return "In Progress";
}

type FilterKey = "all" | LearnerProgressStatus;

export function InstructorReportingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["instructor-overview"],
    queryFn: fetchInstructorOverview,
  });

  const [filter, setFilter] = useState<FilterKey>("all");
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>(loadColumnVisibility);
  const [panelOpen, setPanelOpen] = useState(false);

  const overview = data?.overview;
  const rows = data?.rows ?? [];

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const toggleColumn = (key: ColumnKey) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveColumnVisibility(next);
      return next;
    });
  };

  const cardDefs: {
    key: FilterKey;
    label: string;
    value: number;
    icon: typeof Users;
    color: string;
  }[] = [
    {
      key: "all",
      label: "Total Participants",
      value: overview?.totalParticipants ?? 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      key: "yet_to_start",
      label: "Yet to Start",
      value: overview?.yetToStart ?? 0,
      icon: CircleDashed,
      color: "bg-slate-100 text-slate-600",
    },
    {
      key: "in_progress",
      label: "In Progress",
      value: overview?.inProgress ?? 0,
      icon: Loader2,
      color: "bg-amber-50 text-amber-600",
    },
    {
      key: "completed",
      label: "Completed",
      value: overview?.completed ?? 0,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  if (isLoading) return <div className="p-8 text-slate-500">Loading reporting…</div>;

  return (
    <div className="p-8 max-w-[1400px] mx-auto relative">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Reporting</h1>
          <p className="text-slate-500 text-sm">Course-wise learner progress across your courses.</p>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          {panelOpen ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
          Columns
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cardDefs.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key === "all" ? "all" : c.key)}
            className={cn(
              "text-left bg-white p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md",
              filter === c.key ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-100",
            )}
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 font-black", c.color)}>
              <c.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-slate-900">{c.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Learners</h3>
          {filter !== "all" && (
            <button type="button" onClick={() => setFilter("all")} className="text-xs font-black text-indigo-600 uppercase">
              Clear filter
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                {ALL_COLUMNS.map(
                  (col) =>
                    columns[col.key] && (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((row: InstructorReportRow, idx: number) => (
                <tr key={row.enrollmentId} className="hover:bg-slate-50/50">
                  {columns.sr && <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>}
                  {columns.courseName && <td className="px-4 py-3 font-bold text-slate-800">{row.courseName}</td>}
                  {columns.participantName && (
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{row.participantName}</div>
                      <div className="text-[10px] text-slate-400">{row.participantEmail}</div>
                    </td>
                  )}
                  {columns.enrolledAt && <td className="px-4 py-3 text-slate-600">{formatDate(row.enrolledAt)}</td>}
                  {columns.startDate && <td className="px-4 py-3 text-slate-600">{formatDate(row.startDate)}</td>}
                  {columns.timeSpent && (
                    <td className="px-4 py-3 text-slate-600">
                      {row.timeSpentMinutes > 0 ? `${row.timeSpentMinutes} min` : "—"}
                    </td>
                  )}
                  {columns.completion && (
                    <td className="px-4 py-3 font-bold text-indigo-600">{Math.round(row.completionPercentage)}%</td>
                  )}
                  {columns.completedDate && (
                    <td className="px-4 py-3 text-slate-600">{formatDate(row.completedAt)}</td>
                  )}
                  {columns.status && (
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full",
                          row.status === "completed" && "bg-emerald-50 text-emerald-700",
                          row.status === "in_progress" && "bg-amber-50 text-amber-800",
                          row.status === "yet_to_start" && "bg-slate-100 text-slate-600",
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-medium">No rows for this filter.</div>
          )}
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            aria-label="Close column panel"
            onClick={() => setPanelOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white shadow-2xl border-l border-slate-100 p-6 overflow-y-auto">
            <h4 className="font-black text-slate-900 mb-4">Visible columns</h4>
            <div className="space-y-3">
              {ALL_COLUMNS.map((col) => (
                <label key={col.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columns[col.key]}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
