
"use client";

import { useEffect, useState } from "react";
import { Icon, card, type IconName } from "@/components/ui";
import {
  fetchUserDashboardData,
  type DashboardData,
} from "@/app/lib/admin-api";

const EMPTY_DATA: DashboardData = {
  totalVisitors: 0,
  in: 0,
  out: 0,
  failedAuth: 0,
  graph: [],
};

// Change these two colors to match your user login theme.
const USER_THEME = {
  primary: "#0d9488",
  light: "#e6f2ef",
};

const STATS: {
  label: string;
  key: keyof Pick<
    DashboardData,
    "totalVisitors" | "in" | "out" | "failedAuth"
  >;
  icon: IconName;
}[] = [
    { label: "Total Visitors", key: "totalVisitors", icon: "users" },
    { label: "In Premises", key: "in", icon: "users" },
    { label: "Out of Premises", key: "out", icon: "cart" },
    {
      label: "Failed Authentication",
      key: "failedAuth",
      icon: "trend",
    },
  ];

function getLoggedInUserId(): string {
  if (typeof window === "undefined") return "";

  const directId = localStorage.getItem("user_id");
  if (directId) return directId;

  for (const key of ["user", "auth_user", "currentUser"]) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const user = JSON.parse(raw);
      const id = user?.id ?? user?.user?.id ?? user?.data?.id;

      if (id !== undefined && id !== null && String(id).trim()) {
        return String(id);
      }
    } catch {
      // Ignore invalid stored values.
    }
  }

  return "";
}

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

          const percentage = (visitors / maxVisitors) * 100;

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

export default function UserDashboardPage() {
  const [userId, setUserId] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setUserId(getLoggedInUserId());
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result = await fetchUserDashboardData(
          userId,
          "/api/admin/get-dashboard-data"
        );

        if (active) setData(result);
      } catch (err) {
        if (!active) return;

        setData(EMPTY_DATA);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch dashboard data."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [userId, authChecked]);

  return (
    <div className="space-y-6">
      {/* Dashboard heading */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: USER_THEME.primary }}
        >
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your premises visitor overview
        </p>
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
                : Number(data[stat.key] ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </section>

      {/* Weekly visitor graph */}
      <section className={`rounded-xl border  border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-5`}>
        <div className="flex  items-center justify-between gap-3">
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
