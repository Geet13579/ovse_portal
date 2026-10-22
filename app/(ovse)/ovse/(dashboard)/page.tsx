
"use client";

import { useEffect, useState } from "react";
import { Icon, card, type IconName } from "@/components/ui";
import {
  fetchAdminUsers,
  fetchDashboardData,
  type ApiUser,
  type DashboardData,
} from "@/app/lib/admin-api";

const INITIAL_DATA: DashboardData = {
  totalVisitors: 0,
  in: 0,
  out: 0,
  failedAuth: 0,
  graph: [],
};

// Theme colors defined locally in this page only.
const USER_THEME = {
  primary: "#2563eb",
  light: "#eef2ff",
  focusRing: "rgba(79, 70, 229, 0.12)",
};

const STATS: {
  label: string;
  key: keyof Pick<
    DashboardData,
    "totalVisitors" | "in" | "out" | "failedAuth"
  >;
  icon: IconName;
}[] = [
    {
      label: "Total Visitors",
      key: "totalVisitors",
      icon: "users",
    },
    {
      label: "In Premises",
      key: "in",
      icon: "users",
    },
    {
      label: "Out of Premises",
      key: "out",
      icon: "cart",
    },
    {
      label: "Failed Authentication",
      key: "failedAuth",
      icon: "trend",
    },
  ];

function VisitorChart({
  data,
}: {
  data: DashboardData["graph"];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-center text-sm text-slate-500">
        No weekly visitor data available.
      </div>
    );
  }

  const maxVisitors = Math.max(
    ...data.map((item) => Number(item.visitors) || 0),
    1
  );

  const hasVisitors = data.some(
    (item) => Number(item.visitors) > 0
  );

  return (
    <div
      className="py-6"
      role="img"
      aria-label="Weekly visitor activity bar chart"
    >
      {!hasVisitors && (
        <p className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          No visitors recorded for the selected week.
        </p>
      )}

      <div className="space-y-5">
        {data.map((item, index) => {
          const visitors = Math.max(
            0,
            Number(item.visitors) || 0
          );

          const percentage =
            (visitors / maxVisitors) * 100;

          return (
            <div key={`${item.day}-${index}`}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {item.day}
                </span>

                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {visitors.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    minWidth: visitors > 0 ? "4px" : "0",
                    backgroundColor: USER_THEME.primary,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [data, setData] =
    useState<DashboardData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load available premises.
  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        setUsersLoading(true);
        setError("");

        const result = await fetchAdminUsers();

        if (!active) return;

        setUsers(result);

        setSelectedUserId(
          result.length ? String(result[0].id) : ""
        );
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load premises."
        );
      } finally {
        if (active) {
          setUsersLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  // Fetch dashboard data whenever selected premises changes.
  useEffect(() => {
    if (usersLoading) return;

    if (!selectedUserId) {
      setData(INITIAL_DATA);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result = await fetchDashboardData(
          selectedUserId,
          "/api/admin/get-dashboard-data"
        );

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (!active || controller.signal.aborted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch dashboard data."
        );

        setData(INITIAL_DATA);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedUserId, usersLoading]);

  return (
    <div className="space-y-6">
      {/* Heading and premises selector */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: USER_THEME.primary }}
          >
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Premises visitor overview
          </p>
        </div>

        <div className="w-full sm:w-72">
          <label
            htmlFor="dashboard-premises"
            className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            Select Premises
          </label>

          <div className="relative">
            <select
              id="dashboard-premises"
              value={selectedUserId}
              disabled={usersLoading || users.length === 0}
              onChange={(event) =>
                setSelectedUserId(event.target.value)
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-4 pr-11 text-sm text-slate-900 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              style={{
                borderColor: USER_THEME.primary,
              }}
              onFocus={(event) => {
                event.currentTarget.style.boxShadow =
                  `0 0 0 4px ${USER_THEME.focusRing}`;
              }}
              onBlur={(event) => {
                event.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="">
                {usersLoading
                  ? "Loading premises..."
                  : users.length === 0
                    ? "No premises available"
                    : "Select Premises"}
              </option>

              {users.map((user) => (
                <option
                  key={String(user.id)}
                  value={String(user.id)}
                >
                  {user.name}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
              <svg
                className="h-4 w-4"
                style={{ color: USER_THEME.primary }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m7 10 5 5 5-5" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {/* Statistic cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.key}
            className={`${card} p-5 transition-all duration-200`}
            style={{
              borderTop: `3px solid ${USER_THEME.primary}`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>

              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: USER_THEME.light,
                  color: USER_THEME.primary,
                }}
              >
                <Icon name={stat.icon} />
              </span>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {loading
                ? "..."
                : Number(data[stat.key] ?? 0).toLocaleString(
                  "en-IN"
                )}
            </p>
          </div>
        ))}
      </section>

      {/* Weekly visitor graph */}
      <section className={`${card} p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Visitor Graph</h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weekly visitor activity
            </p>
          </div>

          <span
            className="rounded-md px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: USER_THEME.light,
              color: USER_THEME.primary,
            }}
          >
            Weekly
          </span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            Loading visitor data...
          </div>
        ) : (
          <VisitorChart data={data.graph} />
        )}
      </section>
    </div>
  );
}
