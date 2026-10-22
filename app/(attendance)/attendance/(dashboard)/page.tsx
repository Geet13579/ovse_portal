
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

// Revenue-style line chart for visitor activity.
function VisitorChart({
  data,
}: {
  data: DashboardData["graph"];
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 640;
  const H = 260;
  const pad = { t: 24, r: 20, b: 32, l: 40 };

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No visitor data available.
      </div>
    );
  }

  const values = data.map((item) =>
    Math.max(0, Number(item.visitors) || 0)
  );

  const maxValue = Math.max(...values, 1);
  const max = Math.ceil(maxValue / 5) * 5 || 5;

  const chartWidth = W - pad.l - pad.r;
  const chartHeight = H - pad.t - pad.b;

  const x = (i: number) =>
    data.length === 1
      ? pad.l + chartWidth / 2
      : pad.l + (i * chartWidth) / (data.length - 1);

  const y = (value: number) =>
    pad.t + (1 - value / max) * chartHeight;

  const points = values.map((value, i) => ({
    x: x(i),
    y: y(value),
  }));

  // Smooth curve between points.
  const line = points
    .map((point, i) => {
      if (i === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = points[i - 1];
      const midX = (previous.x + point.x) / 2;

      return (
        `C ${midX} ${previous.y}, ` +
        `${midX} ${point.y}, ${point.x} ${point.y}`
      );
    })
    .join(" ");

  const area =
    `${line} L ${x(data.length - 1)} ${H - pad.b}` +
    ` L ${x(0)} ${H - pad.b} Z`;

  const ticks = Array.from(
    { length: 5 },
    (_, i) => Math.round((max * i) / 4)
  );

  return (
    <div className="pt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-64 w-full"
        role="img"
        aria-label="Visitor activity line chart"
      >
        <defs>
          <linearGradient
            id="visitor-area-gradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#6366f1"
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor="#6366f1"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Dotted grid lines and Y-axis */}
        {ticks.map((tick, i) => (
          <g key={`${tick}-${i}`}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeDasharray="3 4"
            />

            <text
              x={pad.l - 9}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-slate-400 text-[10px]"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Gradient area */}
        <path d={area} fill="url(#visitor-area-gradient)" />

        {/* Smooth indigo line */}
        <path
          d={line}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points and labels */}
        {data.map((item, i) => (
          <g
            key={`${item.day}-${i}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer"
          >
            <circle
              cx={points[i].x}
              cy={points[i].y}
              r={hover === i ? 5 : 3}
              fill="white"
              stroke="#6366f1"
              strokeWidth={2}
              className="dark:fill-slate-900"
            />

            <text
              x={points[i].x}
              y={H - 9}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {item.day}
            </text>
          </g>
        ))}

        {/* Hover tooltip */}
        {hover !== null && (
          <g pointerEvents="none">
            <rect
              x={Math.min(
                Math.max(points[hover].x - 43, 0),
                W - 86
              )}
              y={Math.max(points[hover].y - 36, 0)}
              width={86}
              height={24}
              rx={6}
              className="fill-slate-900 dark:fill-slate-100"
            />

            <text
              x={Math.min(
                Math.max(points[hover].x, 43),
                W - 43
              )}
              y={Math.max(points[hover].y - 20, 16)}
              textAnchor="middle"
              className="fill-white text-[11px] font-medium dark:fill-slate-900"
            >
              {values[hover]} visitors
            </text>
          </g>
        )}
      </svg>
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

  // Load premises list.
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
        if (active) setUsersLoading(false);
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  // Fetch dashboard data for the selected premises.
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
        if (!active || controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch dashboard data."
        );

        setData(INITIAL_DATA);
      } finally {
        if (active) setLoading(false);
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
      {/* Page heading and premises selector */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
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
              className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-4 pr-11 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                className="h-4 w-4 text-slate-500 dark:text-slate-400"
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
            className={`${card} p-5`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
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

      {/* Visitor Graph */}
      <section className={`${card} p-5`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Visitor Graph</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weekly visitor activity
            </p>
          </div>

          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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
