
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authorizedFetch } from "@/app/lib/api-client";
import { fetchAdminUsers, type ApiUser } from "@/app/lib/admin-api";

type Activity = {
    created_at?: string | null;
    res_msg?: string | null;
    res_code?: string | number | null;
    transaction_id?: string | number | null;
    id?: string | number | null;
};

type VisitRecord = {
    id?: string | number;
    name?: string | null;
    mobile?: string | number | null;
    visitor_name?: string | null;
    visitor_mobile?: string | number | null;
    in?: Activity | null;
    out?: Activity | null;
    created_at?: string | null;
    transaction_id?: string | number | null;
};

type ApiResponse = {
    data?: VisitRecord[] | { transactions?: VisitRecord[] };
    transactions?: VisitRecord[];
};

type VisitRow = VisitRecord & {
    __visitNumber: number;
    __visitTotal: number;
};

const PAGE_SIZE = 10;

function getLocalDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
}

function formatDateTime(value?: string | null) {
    if (!value) return "—";

    return `${formatDate(value)} · ${formatTime(value)}`;
}

function getDuration(start?: string | null, end?: string | null) {
    if (!start || !end) return "—---";

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (
        Number.isNaN(startTime) ||
        Number.isNaN(endTime) ||
        endTime < startTime
    ) {
        return "—---";
    }

    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days) return `${days}d ${hours}h ${minutes}m`;
    if (hours) return `${hours}h ${minutes}m`;
    if (minutes) return `${minutes}m ${seconds}s`;

    return `${seconds}s`;
}

function getVisitorName(row: VisitRecord) {
    return row.name || row.visitor_name || "Unknown visitor";
}

function getVisitorMobile(row: VisitRecord) {
    return String(row.mobile || row.visitor_mobile || "—");
}

function getVisitStatus(row: VisitRecord) {
    if (row.out?.created_at) return "Completed";
    if (row.in?.created_at) return "Inside";
    return "Unknown";
}

function getStatusClass(status: string | number | null | undefined) {
    const value = String(status ?? "").toLowerCase();

    if (
        value.includes("success") ||
        value.includes("completed") ||
        value === "200" ||
        value === "true"
    ) {
        return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300";
    }

    if (
        value.includes("fail") ||
        value.includes("error") ||
        value.includes("reject") ||
        value.startsWith("4") ||
        value.startsWith("5")
    ) {
        return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300";
    }

    if (
        value.includes("pending") ||
        value.includes("inside") ||
        value.includes("process")
    ) {
        return "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200";
    }

    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300";
}

function StatusBadge({
    status,
    code,
}: {
    status?: string | number | null;
    code?: string | number | null;
}) {
    return (
        <span
            className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}
        >
            <span className="truncate">{status ?? "—"} {code ? " / " + code : ""} </span>
        </span>
    );
}



function ActivityCard({
    activity,
    type,
    isVisitCompleted,
    isCurrentlyInside,
}: {
    activity?: Activity | null;
    type: "in" | "out";
    isVisitCompleted: boolean;
    isCurrentlyInside: boolean;
}) {
    const isIn = type === "in";
    const isCurrent = isCurrentlyInside && !isIn;

    const cardClass = isVisitCompleted
        ? "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
        : isIn
            ? "border-emerald-200 dark:border-emerald-800"
            : "border-rose-200 dark:border-rose-800";

    const headerClass = isVisitCompleted
        ? "bg-slate-200 dark:bg-slate-700"
        : isIn
            ? "bg-emerald-50 dark:bg-emerald-950/50"
            : "bg-rose-50 dark:bg-rose-950/50";

    const badgeClass = isVisitCompleted
        ? "bg-slate-500 text-white"
        : isIn
            ? "bg-emerald-600 dark:bg-emerald-700 text-white"
            : "bg-rose-600 dark:bg-rose-700 text-white";

    const titleClass = isVisitCompleted
        ? "text-slate-600 dark:text-slate-300"
        : isIn
            ? "text-emerald-800 dark:text-emerald-200"
            : "text-rose-700 dark:text-rose-300";

    return (
        <div
            className={`min-w-0 overflow-hidden rounded-md border ${cardClass}`}
        >
            <div
                className={`flex items-center gap-2 px-2 py-1 ${headerClass}`}
            >
                <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}
                >
                    {isIn ? "IN" : "OUT"}
                </span>

                <span
                    className={`text-[11px] font-semibold ${titleClass}`}
                >
                    {isIn ? "Entry" : "Exit"}
                </span>
            </div>

            <div
                className={`space-y-1.5 px-2 py-2 ${isVisitCompleted
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "bg-white dark:bg-slate-900"
                    }`}
            >
                {isCurrent ? (
                    <div className="py-2">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                            Currently Inside
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            Waiting for OUT
                        </p>
                    </div>
                ) : (
                    <>
                        <p
                            className={`text-[11px] font-semibold leading-4 ${isVisitCompleted
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-slate-800 dark:text-slate-200"
                                }`}
                        >
                            {formatDateTime(activity?.created_at)}
                        </p>

                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Status:
                            </span>

                            <StatusBadge
                                status={activity?.res_msg}
                                code={activity?.res_code}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


export default function VisitorInOutDetailsPage() {
    const [records, setRecords] = useState<VisitRecord[]>([]);
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [usersLoading, setUsersLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");


    // No date is selected by default; show records from all dates.
    const [dateFilter, setDateFilter] = useState("all");
    const [customDate, setCustomDate] = useState("");

    const [page, setPage] = useState(1);

    const today = getLocalDateString(new Date());

    const loadUsers = useCallback(async () => {
        setUsersLoading(true);
        setError("");

        try {
            const result = await fetchAdminUsers();
            setUsers(result);

            if (result.length > 0) {
                setSelectedUserId((currentId) => {
                    const exists = result.some(
                        (user) => String(user.id) === currentId
                    );

                    return exists ? currentId : String(result[0].id);
                });
            } else {
                setSelectedUserId("");
                setRecords([]);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load users."
            );
        } finally {
            setUsersLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const fetchRecords = useCallback(
        async (showLoader = true) => {
            if (!selectedUserId) {
                setRecords([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (showLoader) setLoading(true);
            else setRefreshing(true);

            setError("");

            try {
                const params = new URLSearchParams();

                // Premises / user filter
                params.set("user_id", selectedUserId);

                // Date filter
                params.set("date_filter", dateFilter);

                // Send a date only when the user selects one
                if (customDate) {
                    params.set("custom_date", customDate);
                }

                const endpoint =
                    `/api/admin/intent-transaction-by-user/${selectedUserId}?${params.toString()}`;

                const response = await authorizedFetch(endpoint);

                if (!response.ok) {
                    throw new Error(
                        `Request failed (${response.status})`
                    );
                }

                const result = (await response.json()) as ApiResponse;

                let items: VisitRecord[] = [];

                if (Array.isArray(result.data)) {
                    items = result.data;
                } else if (
                    result.data &&
                    !Array.isArray(result.data) &&
                    Array.isArray(result.data.transactions)
                ) {
                    items = result.data.transactions;
                } else if (Array.isArray(result.transactions)) {
                    items = result.transactions;
                }

                setRecords(items);
                setPage(1);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load visitor details."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [selectedUserId, dateFilter, customDate]
    );

    useEffect(() => {
        if (usersLoading || !selectedUserId) return;
        void fetchRecords();
    }, [fetchRecords, selectedUserId, usersLoading]);

    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => {
            const aTime = new Date(
                a.in?.created_at || a.created_at || 0
            ).getTime();

            const bTime = new Date(
                b.in?.created_at || b.created_at || 0
            ).getTime();

            return bTime - aTime;
        });
    }, [records]);

    const visitRecords = useMemo<VisitRow[]>(() => {
        const getKey = (row: VisitRecord) => {
            const mobile = getVisitorMobile(row);

            return mobile !== "—"
                ? mobile
                : getVisitorName(row).toLowerCase();
        };

        const totals = new Map<string, number>();

        sortedRecords.forEach((row) => {
            const key = getKey(row);
            totals.set(key, (totals.get(key) || 0) + 1);
        });

        const seen = new Map<string, number>();

        return sortedRecords.map((row) => {
            const key = getKey(row);
            const visitNumber = (seen.get(key) || 0) + 1;

            seen.set(key, visitNumber);

            return {
                ...row,
                __visitNumber: visitNumber,
                __visitTotal: totals.get(key) || 1,
            };
        });
    }, [sortedRecords]);

    const summary = useMemo(() => {
        const uniqueVisitors = new Set(
            visitRecords.map((row) => {
                const mobile = getVisitorMobile(row);

                return mobile !== "—"
                    ? mobile
                    : getVisitorName(row).toLowerCase();
            })
        ).size;

        return {
            total: visitRecords.length,
            uniqueVisitors,
            completed: visitRecords.filter(
                (row) => Boolean(row.out?.created_at)
            ).length,
            inside: visitRecords.filter(
                (row) =>
                    Boolean(row.in?.created_at) &&
                    !row.out?.created_at
            ).length,
        };
    }, [visitRecords]);

    const filteredRecords = useMemo(() => {
        return visitRecords.filter((row) => {
            // Filter by the visitor's IN date, falling back to record date.
            const visitDate = row.in?.created_at || row.created_at;

            if (dateFilter !== "all") {
                if (!visitDate) return false;

                const parsedDate = new Date(visitDate);

                if (Number.isNaN(parsedDate.getTime())) return false;

                const recordDate = getLocalDateString(parsedDate);

                if (dateFilter === "today" && recordDate !== today) {
                    return false;
                }

                if (
                    dateFilter === "custom" &&
                    (!customDate || recordDate !== customDate)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [
        visitRecords,
        dateFilter,
        customDate,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRecords.length / PAGE_SIZE)
    );

    const currentPage = Math.min(page, totalPages);

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [dateFilter, customDate]);

    function clearFilters() {
        setDateFilter("all");
        setCustomDate("");
        setPage(1);
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 sm:p-5">
            <div className="mx-auto max-w-[1800px] space-y-4">

                {/* Heading */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Visitor Details
                    </h1>

                    <button
                        type="button"
                        onClick={() => void fetchRecords(false)}
                        disabled={loading || refreshing || !selectedUserId}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className={refreshing ? "animate-spin" : ""}>
                            ↻
                        </span>
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>


                {/* Filters */}
                <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-4 ">

                        <div>
                            <label
                                htmlFor="user-filter"
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
                                    className="
        h-11 w-full appearance-none rounded-xl
        border border-slate-300 bg-white
        pl-4 pr-11 text-sm font-medium text-slate-900
        shadow-sm transition-all duration-200
        hover:border-slate-400
        focus:border-indigo-500 focus:outline-none
        focus:ring-4 focus:ring-indigo-500/10
        disabled:cursor-not-allowed disabled:opacity-60
        dark:border-slate-700 dark:bg-slate-900
        dark:text-slate-100 dark:hover:border-slate-600
      "
                                >
                                    <option value="">
                                        {usersLoading
                                            ? "Loading premises..."
                                            : users.length === 0
                                                ? "No premises available"
                                                : "Select Premises"}
                                    </option>

                                    {users.map((user) => (
                                        <option key={String(user.id)} value={String(user.id)}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>

                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                                    <svg
                                        className="h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-400"
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

                        <div>
                            <label
                                htmlFor="custom-date"
                                className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                            >
                                Select Date
                            </label>

                            <input
                                id="custom-date"
                                type="date"
                                value={customDate}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setCustomDate(value);
                                    setDateFilter(value ? "custom" : "all");
                                    setPage(1);
                                }}
                                className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-xs outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                            />
                        </div>

                    </div>


                </section>

                {/* Error message */}
                {error && (
                    <div
                        role="alert"
                        className="flex flex-col justify-between gap-2 rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 sm:flex-row sm:items-center"
                    >
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => void fetchRecords()}
                            className="self-start font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                )}
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        {
                            title: "Total Visitors",
                            value: summary.total
                        },
                        {
                            title: "In Premises",
                            value: summary.uniqueVisitors
                        },
                        {
                            title: "Out of Premises",
                            value: summary.completed
                        },
                        {
                            title: "Failed Authentication",
                            value: summary.inside
                        },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3"
                        >
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {item.title}
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                {item.value.toLocaleString("en-IN")}
                            </p>

                        </div>
                    ))}
                </div>



                {/* Visit activity table */}
                <section className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Current Visitor Activities
                        </h2>


                        <div className="flex items-center gap-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {filteredRecords.length === 0
                                        ? 0
                                        : (currentPage - 1) * PAGE_SIZE + 1}
                                    {"–"}
                                    {Math.min(
                                        currentPage * PAGE_SIZE,
                                        filteredRecords.length
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {filteredRecords.length}
                                </span>{" "}
                                visits
                            </p>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-semibold text-slate-600 dark:text-slate-300 underline underline-offset-2 hover:text-blue-600"
                            >
                                Clear filters
                            </button>
                        </div>

                    </div>

                    {/* Mobile cards: shown only below the md breakpoint */}
                    <div className="space-y-3 p-3 md:hidden">
                        {loading ? (
                            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                Loading visitor details...
                            </p>
                        ) : paginatedRecords.length === 0 ? (
                            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                No visitor records found.
                            </p>
                        ) : (
                            paginatedRecords.map((row, index) => {
                                const isCompleted = Boolean(
                                    row.in?.created_at && row.out?.created_at
                                );
                                const isInside = Boolean(
                                    row.in?.created_at && !row.out?.created_at
                                );
                                const visitNumber =
                                    (currentPage - 1) * PAGE_SIZE + index + 1;

                                return (
                                    <article
                                        key={
                                            row.id ??
                                            `${getVisitorMobile(row)}-${row.in?.created_at ?? index}-${index}`
                                        }
                                        className="min-w-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 p-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        {visitNumber}
                                                    </span>
                                                    <p className="break-words text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">
                                                        {getVisitorName(row)}
                                                    </p>
                                                </div>
                                                <p className="mt-1 pl-8 break-all text-xs text-slate-500 dark:text-slate-400">
                                                    Mobile: {getVisitorMobile(row)}
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                <StatusBadge status={getVisitStatus(row)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 p-3 min-[360px]:grid-cols-2">
                                            <ActivityCard
                                                activity={row.in}
                                                type="in"
                                                isVisitCompleted={isCompleted}
                                                isCurrentlyInside={false}
                                            />
                                            <ActivityCard
                                                activity={row.out}
                                                type="out"
                                                isVisitCompleted={isCompleted}
                                                isCurrentlyInside={isInside}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Visit Duration
                                            </span>
                                            <span className="break-words text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {getDuration(
                                                    row.in?.created_at,
                                                    row.out?.created_at
                                                )}
                                            </span>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>

                    {/* Desktop table: original layout and styling preserved */}
                    <div className="hidden w-full overflow-x-auto md:block">
                        <table className="w-full min-w-[1150px] table-fixed border-collapse text-left text-sm">
                            <colgroup>
                                <col style={{ width: "7%" }} />
                                <col style={{ width: "16%" }} />
                                <col style={{ width: "45%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "13%" }} />
                            </colgroup>

                            <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                <tr>
                                    {[
                                        "#",
                                        "Visitor",
                                        "IN / OUT Activity",
                                        "Duration",
                                        "Visit Status",
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="border-b border-r border-slate-200 dark:border-slate-700 px-3 py-4 font-bold last:border-r-0"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                                        >
                                            Loading visitor details...
                                        </td>
                                    </tr>
                                ) : paginatedRecords.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                                        >
                                            No visitor records found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRecords.map((row, index) => (
                                        <tr
                                            key={
                                                row.id ??
                                                `${getVisitorMobile(row)}-${row.in?.created_at ?? index}-${index}`
                                            }
                                            className="transition-colors hover:bg-slate-50/70"
                                        >
                                            <td className="border-r border-slate-100 dark:border-slate-800 px-3 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {(currentPage - 1) * PAGE_SIZE +
                                                    index +
                                                    1}
                                            </td>

                                            <td className="border-r border-slate-100 dark:border-slate-800 px-3 py-5">
                                                <p className="break-words text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">
                                                    {getVisitorName(row)}
                                                </p>
                                                <p className="break-words text-xs mt-1 leading-5 text-slate-900 dark:text-slate-100">
                                                    {getVisitorMobile(row)}
                                                </p>

                                                <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                                                    Gender
                                                </p>

                                            </td>



                                            {/* IN and OUT cards side-by-side */}

                                            {/* IN and OUT cards side-by-side */}
                                            <td className="border-r border-slate-100 dark:border-slate-800 px-3 py-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <ActivityCard
                                                        activity={row.in}
                                                        type="in"
                                                        isVisitCompleted={Boolean(
                                                            row.in?.created_at && row.out?.created_at
                                                        )}
                                                        isCurrentlyInside={false}
                                                    />

                                                    <ActivityCard
                                                        activity={row.out}
                                                        type="out"
                                                        isVisitCompleted={Boolean(
                                                            row.in?.created_at && row.out?.created_at
                                                        )}
                                                        isCurrentlyInside={Boolean(
                                                            row.in?.created_at && !row.out?.created_at
                                                        )}
                                                    />
                                                </div>
                                            </td>


                                            <td className="border-r border-slate-100 dark:border-slate-800 px-3 py-5">
                                                <p className="text-sm text-center text-slate-900 dark:text-slate-100">
                                                    {getDuration(
                                                        row.in?.created_at,
                                                        row.out?.created_at
                                                    )}
                                                </p>
                                            </td>

                                            <td className="px-3 py-5">
                                                <StatusBadge
                                                    status={getVisitStatus(row)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col justify-between gap-3 border-t border-slate-200 dark:border-slate-700 px-4 py-4 sm:flex-row sm:items-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Page {currentPage} of {totalPages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() =>
                                    setPage((previous) =>
                                        Math.max(1, previous - 1)
                                    )
                                }
                                className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="min-w-8 text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                                {currentPage}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    currentPage >= totalPages || loading
                                }
                                onClick={() =>
                                    setPage((previous) =>
                                        Math.min(totalPages, previous + 1)
                                    )
                                }
                                className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
