"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type ApiUser,
  displayScope,
  fetchAdminUsers,
  formatDate,
  updateAdminUser,
  deleteAdminUser,
} from "@/app/lib/admin-api";

type SortKey =
  | "id"
  | "name"
  | "email"
  | "premises_addr"
  | "role"
  | "user_scope"
  | "is_active"
  | "created_at"
  | "updated_at";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950";

const CLAIMS = [
  "credentialIssuingDate",
  "enrolmentDate",
  "enrolmentNumber",
  "isNRI",
  "residentImage",
  "residentName",
  "localResidentName",
  "ageAbove18",
  "ageAbove50",
  "ageAbove60",
  "ageAbove75",
  "dob",
  "gender",
  "careOf",
  "localCareOf",
  "building",
  "localBuilding",
  "locality",
  "localLocality",
  "street",
  "localStreet",
  "landmark",
  "localLandmark",
  "vtc",
  "localVtc",
  "subDistrict",
  "localSubDistrict",
  "district",
  "localDistrict",
  "state",
  "localState",
  "poName",
  "localPoName",
  "pincode",
  "address",
  "regionalAddress",
  "mobile",
  "maskedMobile",
  "email",
  "maskedEmail",
  "notDefined",
  "maskedAadhaar",
];

function makeBitmap(selected: number[]) {
  const selectedSet = new Set(selected);
  return Array.from({ length: CLAIMS.length }, (_, index) =>
    selectedSet.has(index + 1) ? "1" : "0"
  ).join("");
}

function parseBitmap(value: ApiUser["user_scope"]): number[] {
  const bitmap = String(value ?? "").slice(-CLAIMS.length);
  const offset = CLAIMS.length - bitmap.length;

  return Array.from(bitmap).flatMap((bit, index) =>
    bit === "1" ? [offset + index + 1] : []
  );
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

  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPremisesAddress, setEditPremisesAddress] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editClaims, setEditClaims] = useState<number[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

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

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = users.filter((user) => {
      const searchableValues = [
        user.name,
        user.email,
        String(user.id),
        String(user.role ?? ""),
        displayScope(user.user_scope),

        user.premises_addr,
      ];

      const matchesQuery =
        !q ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(q)
        );

      const matchesStatus =
        active === "all" ||
        (active === "active" &&
          (user.is_active === true || user.is_active === 1)) ||
        (active === "inactive" &&
          (user.is_active === false || user.is_active === 0));

      return matchesQuery && matchesStatus;
    });

    const direction = sortDir === "asc" ? 1 : -1;

    return [...result].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (sortKey === "id") {
        return (Number(av || 0) - Number(bv || 0)) * direction;
      }

      return (
        String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
          numeric: true,
        }) * direction
      );
    });
  }, [users, query, active, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function sortBy(key: SortKey) {
    if (sortKey === key) {
      setSortDir((previous) => (previous === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        key === "created_at" || key === "updated_at" ? "desc" : "asc"
      );
    }
    setPage(1);
  }

  function openEdit(user: ApiUser) {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditPremisesAddress(user.premises_addr || "");
    // Never prefill a password. Blank means "do not change password".
    setEditPassword("");
    setEditClaims(parseBitmap(user.user_scope));
    setActionError("");
    setActionSuccess("");
  }

  function toggleClaim(id: number, checked: boolean) {
    setEditClaims((previous) =>
      checked
        ? [...new Set([...previous, id])].sort((a, b) => a - b)
        : previous.filter((item) => item !== id)
    );
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser || actionLoading) return;

    if (editName.trim().length < 2) {
      setActionError("Name must contain at least 2 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(editEmail.trim())) {
      setActionError("Enter a valid email address.");
      return;
    }

    if (editClaims.length === 0) {
      setActionError("Select at least one claim.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const payload: {
        name: string;
        email: string;
        user_scope: string;
        premises_addr: string;
        password?: string;
      } = {
        name: editName.trim(),
        email: editEmail.trim(),
        user_scope: makeBitmap(editClaims),
        premises_addr: editPremisesAddress.trim(),
      };

      // Only send password when the admin entered a new one.
      if (editPassword.length > 0) {
        payload.password = editPassword;
      }

      await updateAdminUser(editingUser.id, payload);

      setEditingUser(null);
      setEditPassword("");
      setActionSuccess("User updated successfully.");

      // Clear success message after 5 seconds
      setTimeout(() => {
        setActionSuccess("");
      }, 5000);

      await loadUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update user.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(user: ApiUser) {
    if (actionLoading) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name || user.email}?`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      await deleteAdminUser(user.id);
      setActionSuccess("User deleted successfully.");
      await loadUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setActionLoading(false);
    }
  }

  const columns: {
    key: SortKey;
    label: string;
    render: (user: ApiUser) => React.ReactNode;
  }[] = [
      {
        key: "id",
        label: "ID",
        render: (u) => (
          <span className="font-mono text-xs text-slate-500">#{u.id}</span>
        ),
      },
      {
        key: "name",
        label: "Name",
        render: (u) => (
          <span className="font-semibold text-slate-900 dark:text-white">
            {u.name || "—"}
          </span>
        ),
      },
      {
        key: "email",
        label: "Username",
        render: (u) => <span className="break-all">{u.email || "—"}</span>,
      },
      {
        key: "premises_addr",
        label: "Premises Address",
        render: (u) => (
          <span className="inline-block max-w-[260px] break-words">
            {u.premises_addr || "—"}
          </span>
        ),
      },
      {
        key: "user_scope",
        label: "User scope (bitmask)",
        render: (u) => (
          <span
            title={displayScope(u.user_scope)}
            className="inline-block max-w-[220px] break-all rounded-md bg-slate-100 px-2 py-1.5 font-mono text-xs dark:bg-slate-800"
          >
            {displayScope(u.user_scope)}
          </span>
        ),
      },
      {
        key: "role",
        label: "Role",
        render: (u) => (
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {u.role || "—"}
          </span>
        ),
      },

      {
        key: "created_at",
        label: "Created at",
        render: (u) => (
          <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
            {formatDate(u.created_at)}
          </span>
        ),
      },
    ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Users
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage registered users and their access permissions.
            </p>

          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7v5h-5M4 17v-5h5m-4-3a7 7 0 0 1 12-2l3 5M4 12l3 5a7 7 0 0 0 12-2"
                />
              </svg>
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/ovse/create-user"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              <span className="text-lg leading-none">+</span>
              Create User
            </Link>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <p className="font-semibold">Could not load users</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="mt-2 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {actionError && !editingUser && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            {actionSuccess}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m16 16 4 4" />
              </svg>
              <input
                className={`${inputClass} pl-9`}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, ID, address or bitmask..."
                aria-label="Search users"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm md:justify-end">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filtered.length} users
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1200px] table-auto text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3.5 font-semibold"
                    >
                      <button
                        type="button"
                        onClick={() => sortBy(col.key)}
                        className="inline-flex items-center gap-1.5 transition hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {col.label}
                        {sortKey === col.key && (
                          <span className="text-blue-600">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-4 py-14 text-center text-slate-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  rows.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="max-w-[280px] px-4 py-4 align-middle text-slate-600 dark:text-slate-300"
                        >
                          {col.render(user)}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            disabled={actionLoading}
                            className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(user)}
                            disabled={actionLoading}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-4 py-16 text-center"
                    >
                      <p className="font-semibold text-slate-800 dark:text-white">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try another search.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3.5 text-sm text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                {filtered.length > 0
                  ? `${(currentPage - 1) * pageSize + 1}–${Math.min(
                    currentPage * pageSize,
                    filtered.length
                  )}`
                  : "0"}{" "}
                of {filtered.length}
              </span>
              <label className="flex items-center gap-2">
                Rows
                <select
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <span className="min-w-[85px] text-center text-sm">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </footer>
        </section>

        {editingUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-user-title"
              className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
                <div>
                  <h2
                    id="edit-user-title"
                    className="text-xl font-bold text-slate-900 dark:text-white"
                  >
                    Edit User
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    User ID: {editingUser.id}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setEditingUser(null);
                    setActionError("");
                    setEditPassword("");
                  }}
                  aria-label="Close edit dialog"
                  className="rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      Name
                    </label>
                    <input
                      id="edit-name"
                      required
                      minLength={2}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-email"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      Username
                    </label>
                    <input
                      id="edit-email"
                      type="text"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-premises-address"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      Premises Address
                    </label>
                    <input
                      id="edit-premises-address"
                      type="text"
                      value={editPremisesAddress}
                      onChange={(e) => setEditPremisesAddress(e.target.value)}
                      placeholder="Enter premises address"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-password"
                      className="mb-1.5 block text-sm font-semibold"
                    >
                      New Password
                    </label>
                    <input
                      id="edit-password"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Enter New Password"
                      autoComplete="new-password"
                      className={inputClass}
                    />

                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Bit Map Selection
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {editClaims.length} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {CLAIMS.map((claim, index) => {
                      const id = index + 1;
                      return (
                        <label
                          key={id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={editClaims.includes(id)}
                            onChange={(e) => toggleClaim(id, e.target.checked)}
                            className="mt-0.5 accent-blue-600"
                          />
                          <span className="break-words text-slate-600 dark:text-slate-300">
                            <span className="mr-1 font-semibold text-slate-900 dark:text-white">
                              {id}.
                            </span>
                            {claim}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <p className="mb-2 text-sm font-semibold">user_scope</p>
                  <code className="block break-all font-mono text-xs leading-6 text-slate-600 dark:text-slate-300">
                    {makeBitmap(editClaims)}
                  </code>
                </div>

                {actionError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {actionError}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      setEditingUser(null);
                      setActionError("");
                      setEditPassword("");
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
