"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type ApiResult = {
    status?: boolean | string;
    message?: string;
    data?: unknown;
    txn_id?: string;
    txn?: string;
    job_status?: string;
};

type IntentDetails = {
    qr_img?: string;
    qrPath?: string;
    qr_url?: string;
    intent_url?: string;
    intentUrl?: string;
    txn_id?: string;
    txn?: string;
    exp?: number | string;
};

type CustomerDetails = {
    name: string;
    mobile: string;
};

function getToken(): string | null {
    if (typeof window === "undefined") return null;

    return (
        localStorage.getItem("adminToken") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("admin_token_v1") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token")
    );
}

function findObjectWithQr(value: unknown): IntentDetails | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findObjectWithQr(item);
            if (found) return found;
        }
        return null;
    }

    if (!value || typeof value !== "object") return null;

    const obj = value as Record<string, unknown>;

    if (
        typeof obj.qr_img === "string" ||
        typeof obj.qrPath === "string" ||
        typeof obj.qr_url === "string"
    ) {
        return obj as IntentDetails;
    }

    for (const item of Object.values(obj)) {
        const found = findObjectWithQr(item);
        if (found) return found;
    }

    return null;
}

function resolveQrUrl(qrPath: string, apiUrl: string): string {
    if (/^(https?:|data:image\/)/i.test(qrPath)) {
        return qrPath;
    }

    const normalizedPath = qrPath
        .replace(/\\/g, "/")
        .replace(/^\.\/public\//, "/public/")
        .replace(/^public\//, "/public/")
        .replace(/^\.\/+/, "/")
        .replace(/^\/+/, "/");

    return `${apiUrl}${normalizedPath}`;
}

function findCustomerDetails(value: unknown): CustomerDetails | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findCustomerDetails(item);
            if (found) return found;
        }
        return null;
    }

    if (!value || typeof value !== "object") return null;

    const obj = value as Record<string, unknown>;

    if (
        typeof obj.name === "string" &&
        obj.name.trim() &&
        (typeof obj.mobile === "string" ||
            typeof obj.mobile === "number")
    ) {
        return {
            name: obj.name.trim(),
            mobile: String(obj.mobile),
        };
    }

    for (const item of Object.values(obj)) {
        const found = findCustomerDetails(item);
        if (found) return found;
    }

    return null;
}

function findTransactionId(value: unknown): string {
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findTransactionId(item);
            if (found) return found;
        }
        return "";
    }

    if (!value || typeof value !== "object") return "";

    const obj = value as Record<string, unknown>;

    if (typeof obj.txn_id === "string" && obj.txn_id.trim()) {
        return obj.txn_id.trim();
    }

    if (typeof obj.txn === "string" && obj.txn.trim()) {
        return obj.txn.trim();
    }

    for (const item of Object.values(obj)) {
        const found = findTransactionId(item);
        if (found) return found;
    }

    return "";
}

function findTransactionStatus(value: unknown): string {
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findTransactionStatus(item);
            if (found) return found;
        }
        return "";
    }

    if (!value || typeof value !== "object") return "";

    const obj = value as Record<string, unknown>;

    const explicitStatus =
        obj.job_status ??
        obj.transaction_status ??
        obj.payment_status ??
        obj.txn_status;

    if (typeof explicitStatus === "string" && explicitStatus.trim()) {
        return explicitStatus.trim().toLowerCase();
    }

    if (typeof obj.status === "string" && obj.status.trim()) {
        return obj.status.trim().toLowerCase();
    }

    for (const item of Object.values(obj)) {
        const found = findTransactionStatus(item);
        if (found) return found;
    }

    return "";
}

export default function IntentRequestPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [details, setDetails] = useState<IntentDetails | null>(null);
    const [txnId, setTxnId] = useState("");
    const [transactionStatus, setTransactionStatus] = useState("Preparing QR");
    const [customer, setCustomer] = useState<CustomerDetails | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    const requestInFlight = useRef(false);
    const successHandled = useRef(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

    // Generate QR. If txn_id is supplied, send it in the POST body.
    const createIntent = useCallback(
        async (transactionId?: string): Promise<IntentDetails | null> => {
            if (requestInFlight.current) return null;

            requestInFlight.current = true;
            setLoading(true);
            setError("");

            try {
                if (!apiUrl) {
                    throw new Error(
                        "API configuration missing. Check NEXT_PUBLIC_API_URL."
                    );
                }

                const token = getToken();

                if (!token) {
                    throw new Error("Login token not found. Please sign in again.");
                }

                const response = await fetch(
                    `${apiUrl}/api/intent/request-intent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        ...(transactionId
                            ? {
                                body: JSON.stringify({
                                    txn_id: transactionId,
                                }),
                            }
                            : {}),
                        cache: "no-store",
                    }
                );

                const result = (await response.json().catch(() => ({}))) as ApiResult;

                if (!response.ok || result.status === false) {
                    throw new Error(
                        result.message ||
                        `QR request failed (HTTP ${response.status}).`
                    );
                }

                const parsed = findObjectWithQr(result.data);
                const qrPath =
                    parsed?.qr_img || parsed?.qrPath || parsed?.qr_url;

                if (!parsed || !qrPath) {
                    throw new Error(
                        result.message || "QR image not found in the API response."
                    );
                }

                setDetails(parsed);

                const returnedTxnId =
                    findTransactionId(result) ||
                    parsed.txn_id ||
                    parsed.txn;

                if (returnedTxnId) {
                    setTxnId(returnedTxnId);
                }

                return parsed;
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Could not generate QR."
                );
                return null;
            } finally {
                requestInFlight.current = false;
                setLoading(false);
            }
        },
        [apiUrl]
    );

    // Generate initial QR, then poll status every 10 seconds.
    useEffect(() => {
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const scheduleNextCheck = (id: string) => {
            if (cancelled || successHandled.current) return;

            timeoutId = setTimeout(() => {
                void checkStatus(id);
            }, 10_000);
        };

        const checkStatus = async (id: string): Promise<void> => {
            if (cancelled || successHandled.current) return;

            try {
                const token = getToken();

                if (!token) {
                    throw new Error("Login token not found. Please sign in again.");
                }

                if (!apiUrl) {
                    throw new Error("API configuration missing.");
                }

                const response = await fetch(
                    `${apiUrl}/api/intent/get-intent-status/${encodeURIComponent(id)}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const result = (await response.json().catch(() => ({}))) as ApiResult;

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        `Status request failed (HTTP ${response.status}).`
                    );
                }

                if (cancelled) return;

                // Display customer details whenever the API provides them.
                const customerDetails = findCustomerDetails(result);

                if (customerDetails) {
                    setCustomer(customerDetails);
                }

                const status = findTransactionStatus(result);
                setTransactionStatus(status || "Pending");

                if (status === "success") {
                    // Stop polling before making the next API request.
                    successHandled.current = true;
                    setIsPolling(false);
                    setPaymentSuccess(true);
                    setTransactionStatus("Success");
                    setError("");

                    const successfulTxnId = findTransactionId(result) || id;
                    setTxnId(successfulTxnId);

                    // Generate/request the next QR with the successful txn_id.
                    // Success UI remains visible even if this follow-up request fails.
                    const nextQr = await createIntent(successfulTxnId);

                    if (!cancelled && !nextQr) {
                        setError(
                            "Payment successful, but the follow-up QR could not be generated."
                        );
                    }

                    return;
                }

                if (
                    [
                        "failed",
                        "failure",
                        "error",
                        "cancelled",
                        "canceled",
                        "expired",
                    ].includes(status)
                ) {
                    setIsPolling(false);
                    setTransactionStatus(status);
                    setError(`Transaction ${status}. Please try again if needed.`);
                    return;
                }

                // Pending / processing: check again in 10 seconds.
                scheduleNextCheck(id);
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error ? err.message : "Status check failed."
                );

                // Retry transient request errors after 10 seconds.
                scheduleNextCheck(id);
            }
        };

        const start = async () => {
            successHandled.current = false;
            setPaymentSuccess(false);
            setCustomer(null);
            setIsPolling(false);
            setError("");
            setTransactionStatus("Preparing QR");

            const initialDetails = await createIntent();

            if (cancelled || !initialDetails) return;

            const id = initialDetails.txn_id || initialDetails.txn;

            if (!id) {
                setTransactionStatus("Unable to start verification");
                setError(
                    "Intent API response mein txn_id nahi mila. API response check karein."
                );
                return;
            }

            setTxnId(id);
            setTransactionStatus("Pending");
            setIsPolling(true);

            // First status request after 10 seconds.
            scheduleNextCheck(id);
        };

        void start();

        return () => {
            cancelled = true;

            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        };
    }, [apiUrl, createIntent]);

    const qrPath = details?.qr_img || details?.qrPath || details?.qr_url;

    const qrImageUrl =
        qrPath && apiUrl ? resolveQrUrl(String(qrPath), apiUrl) : "";

    return (
        <main className="mx-auto mt-8 w-full max-w-5xl space-y-6 px-4 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                        User Portal / Secure Access
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        QR Code
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Scan the QR code and wait for transaction confirmation.
                    </p>
                </div>

                <Link
                    href="/user"
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                    <span aria-hidden="true">←</span>
                    Back to dashboard
                </Link>
            </header>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="flex flex-col justify-between bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 p-6 text-white sm:p-8">
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl">
                                ▦
                            </div>

                            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
                                Secure QR Code
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                                Your QR.
                                <br />
                                Your access.
                            </h2>

                            <p className="mt-3 max-w-xs text-sm leading-6 text-teal-50/90">
                                Transaction status is checked automatically every 10 seconds.
                            </p>
                        </div>

                        <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-4">
                            <p className="text-sm font-semibold">Transaction monitoring</p>
                            <p className="mt-1 text-xs text-teal-50/80">
                                No countdown timer displayed.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 sm:p-8">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Scan QR Code
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Keep this page open while your transaction is being processed.
                        </p>

                        {/* {error && (
                            <div
                                role="alert"
                                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                            >
                                {error}
                            </div>
                        )} */}

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 sm:p-6">
                            {details && qrPath ? (
                                <div className="flex flex-col items-center">
                                    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700">
                                        <img
                                            src={qrImageUrl}
                                            alt="Intent QR code"
                                            className="h-52 w-52 object-contain sm:h-60 sm:w-60"
                                            onError={() =>
                                                setError(
                                                    `QR image could not be loaded. Check the backend static path: ${qrImageUrl}`
                                                )
                                            }
                                        />
                                    </div>

                                    {/* Status and customer information */}
                                    <div className="mt-5 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                                        {paymentSuccess ? (
                                            <div className="text-center">
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-600 dark:bg-green-950/40 dark:text-green-400">
                                                    ✓
                                                </div>

                                                <h3 className="mt-3 text-lg font-bold text-green-700 dark:text-green-400">
                                                    Payment Successful!
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    Your transaction has been verified successfully.
                                                </p>

                                                {customer && (
                                                    <div className="mt-5 rounded-xl bg-green-50 p-4 text-left dark:bg-green-950/30">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Customer Name
                                                        </p>

                                                        <p className="mt-1 break-words font-semibold text-slate-900 dark:text-white">
                                                            {customer.name}
                                                        </p>

                                                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                            Mobile Number
                                                        </p>

                                                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                                            {customer.mobile}
                                                        </p>
                                                    </div>
                                                )}

                                                {txnId && (
                                                    <p className="mt-4 break-all text-left text-xs text-slate-500 dark:text-slate-400">
                                                        Transaction ID: {txnId}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    {/* {isPolling || loading ? (
                                                        <div className="h-7 w-7 shrink-0 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
                                                    ) : (
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                                            !
                                                        </div>
                                                    )} */}

                                                </div>

                                                <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Current status
                                                    </p>

                                                    <p className="mt-1 font-semibold capitalize text-slate-900 dark:text-white">
                                                        {transactionStatus}
                                                    </p>
                                                </div>

                                                {customer && (
                                                    <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Customer Name
                                                        </p>

                                                        <p className="mt-1 break-words font-semibold text-slate-900 dark:text-white">
                                                            {customer.name}
                                                        </p>

                                                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                            Mobile Number
                                                        </p>

                                                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                                            {customer.mobile}
                                                        </p>
                                                    </div>
                                                )}

                                                <p className="mt-4 text-center text-xs text-slate-400">
                                                    Please do not close this page.
                                                </p>

                                                {txnId && (
                                                    <p className="mt-3 break-all text-center text-xs text-slate-400">
                                                        Transaction ID: {txnId}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-[320px] flex-col items-center justify-center px-4 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-teal-100 bg-white text-4xl text-teal-700 dark:border-teal-900 dark:bg-slate-900 dark:text-teal-300">
                                        ▦
                                    </div>

                                    <p className="mt-6 text-base font-semibold text-slate-900 dark:text-white">
                                        {loading ? "Generating your QR..." : "Preparing QR code"}
                                    </p>

                                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        Your QR code will appear here automatically.
                                    </p>

                                    {loading && (
                                        <div className="mt-5 h-6 w-6 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}