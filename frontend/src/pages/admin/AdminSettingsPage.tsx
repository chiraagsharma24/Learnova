export function AdminSettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Minimal platform configuration for now.</p>
      </header>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          Advanced system settings are not exposed in the UI yet. Operational values (database URL, auth
          secrets, etc.) stay in{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">backend/.env</code> and
          your hosting provider.
        </p>
        <p className="text-slate-500">
          Use the Users and Courses sections for day-to-day platform control (roles, blocking, publishing).
        </p>
      </div>
    </div>
  );
}
