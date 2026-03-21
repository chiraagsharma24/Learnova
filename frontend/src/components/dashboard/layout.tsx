import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex">
      <h2>Dashboard</h2>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
