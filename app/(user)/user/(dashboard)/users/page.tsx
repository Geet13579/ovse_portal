"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiUser, displayScope, fetchAdminUsers, formatDate } from "@/app/lib/admin-api";

type SortKey = "id" | "name" | "email" | "role" | "user_scope" | "is_active" | "created_at" | "updated_at";
const inputClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function activeLabel(value: ApiUser["is_active"]) {
  if (value === true || value === 1) return { label: "Active", cls: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" };
  if (value === false || value === 0) return { label: "Inactive", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
  return { label: "Unknown", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" };
}

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminUsers();
      setUsers(result);
      setRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter(user => {
      const matchesQuery = !q || [user.name, user.email, String(user.id), String(user.role || ""), displayScope(user.user_scope)].some(v => v.toLowerCase().includes(q));
      const matchesActive = active === "all" || (active === "active" ? user.is_active === true || user.is_active === 1 : user.is_active === false || user.is_active === 0);
      return matchesQuery && matchesActive;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortKey === "id") return (Number(av || 0) - Number(bv || 0)) * dir;
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true }) * dir;
    });
  }, [users, query, active, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function sortBy(key: SortKey) {
    if (sortKey === key) setSortDir(v => v === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "created_at" || key === "updated_at" ? "desc" : "asc"); }
    setPage(1);
  }

  const columns: { key: SortKey; label: string; render: (user: ApiUser) => React.ReactNode }[] = [
    { key: "id", label: "ID", render: u => <span className="font-mono">{u.id}</span> },
    { key: "name", label: "Name", render: u => <span className="font-semibold text-slate-900 dark:text-white">{u.name || "—"}</span> },
    { key: "email", label: "Email", render: u => <span>{u.email || "—"}</span> },
    { key: "user_scope", label: "User scope (bitmask)", render: u => <span className="inline-block max-w-xs break-all rounded bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">{displayScope(u.user_scope)}</span> },
    { key: "role", label: "Role", render: u => <span>{u.role || "—"}</span> },
    { key: "is_active", label: "Status", render: u => { const s = activeLabel(u.is_active); return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>; } },
    { key: "created_at", label: "Created at", render: u => <span className="whitespace-nowrap">{formatDate(u.created_at)}</span> },
    { key: "updated_at", label: "Updated at", render: u => <span className="whitespace-nowrap">{formatDate(u.updated_at)}</span> },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Aadhaar tracker / Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live user list from the admin users API. Passwords and tokens are intentionally not displayed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void loadUsers()} disabled={loading} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">{loading ? "Refreshing…" : "Refresh"}</button>
            <Link href="/admin/register" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">+ Register user</Link>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center">
            <input className={`${inputClass} w-full md:max-w-md`} value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, email, ID or bitmask…" aria-label="Search users" />
            <select className={inputClass} value={active} onChange={e => { setActive(e.target.value); setPage(1); }} aria-label="Filter by status">
              <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <p className="text-sm text-slate-500 dark:text-slate-400 md:ml-auto">{filtered.length} users{refreshedAt ? ` · Updated ${refreshedAt}` : ""}</p>
          </div>

          {error && <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"><p className="font-semibold">Could not load users</p><p className="mt-1">{error}</p><p className="mt-1">Check that the API is running and allows requests from this frontend (CORS).</p><button onClick={() => void loadUsers()} className="mt-3 underline">Try again</button></div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400"><tr>{columns.map(col => <th key={col.key} className="px-4 py-3 font-semibold"><button onClick={() => sortBy(col.key)} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">{col.label}{sortKey === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</button></th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && users.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-14 text-center text-slate-500">Loading users…</td></tr>}
                {!loading && !error && rows.map(user => <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">{columns.map(col => <td key={col.key} className="max-w-sm px-4 py-4 align-top text-slate-600 dark:text-slate-300">{col.render(user)}</td>)}</tr>)}
                {!loading && !error && rows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-14 text-center text-slate-500">No users found for this search/filter.</td></tr>}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span>{filtered.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)}` : "0"} of {filtered.length}</span><label className="flex items-center gap-2">Rows <select className={inputClass} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>{[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}</select></label></div>
            <div className="flex items-center gap-2"><button disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Previous</button><span>Page {currentPage} / {totalPages}</span><button disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Next</button></div>
          </footer>
        </section>
      </div>
    </main>
  );
}
