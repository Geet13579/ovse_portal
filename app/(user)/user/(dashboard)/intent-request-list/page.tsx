
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authorizedFetch } from "@/app/lib/api-client";

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
    if (!start || !end) return <p className="text-center">- - -</p>

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (
        Number.isNaN(startTime) ||
        Number.isNaN(endTime) ||
        endTime < startTime
    ) {
        return "— - -";
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
    if (row.out?.created_at) return "Visit Completed";
    if (row.in?.created_at) return "Visitor Inside";
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
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    }

    if (
        value.includes("fail") ||
        value.includes("error") ||
        value.includes("reject") ||
        value.startsWith("4") ||
        value.startsWith("5")
    ) {
        return "bg-rose-50 text-rose-700 ring-rose-200";
    }

    if (
        value.includes("pending") ||
        value.includes("inside") ||
        value.includes("process")
    ) {
        return "bg-amber-50 text-amber-700 ring-amber-200";
    }

    return "bg-slate-100 text-slate-600 ring-slate-200";
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
        ? "border-slate-300 bg-slate-100"
        : isIn
            ? "border-emerald-200"
            : "border-rose-200";

    const headerClass = isVisitCompleted
        ? "bg-slate-200"
        : isIn
            ? "bg-emerald-50"
            : "bg-rose-50";

    const badgeClass = isVisitCompleted
        ? "bg-slate-500 text-white"
        : isIn
            ? "bg-emerald-600 text-white"
            : "bg-rose-600 text-white";

    const titleClass = isVisitCompleted
        ? "text-slate-600"
        : isIn
            ? "text-emerald-800"
            : "text-rose-700";

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
                    ? "bg-slate-100"
                    : "bg-white"
                    }`}
            >
                {isCurrent ? (
                    <div className="py-2">
                        <p className="text-xs text-center font-bold text-amber-700">
                            - - -
                        </p>

                    </div>
                ) : (
                    <>
                        <p
                            className={`text-[11px] font-semibold leading-4 ${isVisitCompleted
                                ? "text-slate-500"
                                : "text-slate-800"
                                }`}
                        >
                            {formatDateTime(activity?.created_at)}
                        </p>

                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">
                                Auth. status:
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);

    const fetchRecords = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        setError("");

        try {
            const response = await authorizedFetch(
                "/api/admin/intent-transaction"
            );

            if (!response.ok) {
                throw new Error(`Request failed (${response.status})`);
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
    }, []);

    useEffect(() => {
        void fetchRecords();
    }, [fetchRecords]);

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
                (row) => Boolean(row.in?.created_at) && !row.out?.created_at
            ).length,
        };
    }, [visitRecords]);

    const filteredRecords = visitRecords;

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRecords.length / PAGE_SIZE)
    );

    const currentPage = Math.min(page, totalPages);

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );


    return (
        <main className="min-h-screen bg-slate-50 p-3 text-slate-900 sm:p-5">
            <div className="mx-auto max-w-[1600px] space-y-4">
                {/* Page heading */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Visitor Details
                        </h1>

                    </div>

                    <button
                        type="button"
                        onClick={() => void fetchRecords(false)}
                        disabled={loading || refreshing}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className={refreshing ? "animate-spin" : ""}>↻</span>
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Summary cards */}
                {/* <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <SummaryCard
                        title="Total Visits"
                        value={summary.total}
                        subtitle="All recorded visits"
                    />

                    <SummaryCard
                        title="Unique Visitors"
                        value={summary.uniqueVisitors}
                        subtitle="By mobile or name"
                    />

                    <SummaryCard
                        title="Completed Visits"
                        value={summary.completed}
                        subtitle="IN and OUT recorded"
                    />

                    <SummaryCard
                        title="Currently Inside"
                        value={summary.inside}
                        subtitle="IN recorded, OUT pending"
                    />
                </div> */}

                {/* Error message */}
                {error && (
                    <div
                        role="alert"
                        className="flex flex-col justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-700 sm:flex-row sm:items-center"
                    >
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => void fetchRecords()}
                            className="self-start font-semibold underline underline-offset-2"
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
                            className="rounded-lg border border-slate-200 bg-white px-4 py-3 transition-all duration-200"
                            style={{
                                borderTop: `3px solid #0d9488`,
                            }}
                        >
                            <p className="text-xs font-medium text-slate-500">
                                {item.title}
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                                {item.value.toLocaleString("en-IN")}
                            </p>

                        </div>
                    ))}
                </div>



                {/* Visit activity table */}
                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            Current Visitor Activities
                        </h2>



                    </div>

                    {/* Mobile cards: shown only below the md breakpoint */}
                    <div className="space-y-3 p-3 md:hidden">
                        {loading ? (
                            <p className="py-10 text-center text-sm text-slate-500">
                                Loading visitor details...
                            </p>
                        ) : paginatedRecords.length === 0 ? (
                            <p className="py-10 text-center text-sm text-slate-500">
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
                                        className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 p-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                        {visitNumber}
                                                    </span>
                                                    <p className="break-words text-sm font-bold leading-5 text-slate-900">
                                                        {getVisitorName(row)}
                                                    </p>
                                                </div>
                                                <p className="mt-1 pl-8 break-all text-xs text-slate-500">
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

                                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
                                            <span className="text-xs font-medium text-slate-500">
                                                Visit Duration
                                            </span>
                                            <span className="break-words text-right text-sm font-semibold text-slate-900">
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

                    {/* Desktop table: original layout preserved */}
                    <div className="hidden w-full overflow-x-auto md:block">
                        <table className="w-full min-w-[1150px] table-fixed border-collapse text-left text-sm">
                            <colgroup>
                                <col style={{ width: "7%" }} />
                                <col style={{ width: "16%" }} />
                                <col style={{ width: "45%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "13%" }} />
                            </colgroup>

                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
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
                                            className="border-b border-r border-slate-200 px-3 py-4 font-bold last:border-r-0"
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
                                            className="px-4 py-12 text-center text-sm text-slate-500"
                                        >
                                            Loading visitor details...
                                        </td>
                                    </tr>
                                ) : paginatedRecords.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center text-sm text-slate-500"
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
                                            <td className="border-r border-slate-100 px-3 py-5 text-sm font-medium text-slate-500">
                                                {(currentPage - 1) * PAGE_SIZE +
                                                    index +
                                                    1}
                                            </td>

                                            <td className="border-r border-slate-100 px-3 py-5">
                                                <p className="break-words text-sm font-bold leading-5 text-slate-900">
                                                    {getVisitorName(row)}
                                                </p>
                                                <p className="break-words text-xs mt-1 leading-5 text-slate-900 dark:text-slate-100">
                                                    {getVisitorMobile(row)}
                                                </p>
                                                <p className="mt-1 break-all text-xs text-slate-500">
                                                    Gender
                                                </p>
                                            </td>



                                            {/* IN and OUT cards side-by-side */}

                                            {/* IN and OUT cards side-by-side */}
                                            <td className="border-r border-slate-100 px-3 py-3">
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


                                            <td className="border-r border-slate-100 px-3 py-5">
                                                <p className="text-sm text-center text-slate-900">
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
                    <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center">
                        <p className="text-xs text-slate-500">
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
                                className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="min-w-8 text-center text-sm font-bold text-slate-700">
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
                                className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
