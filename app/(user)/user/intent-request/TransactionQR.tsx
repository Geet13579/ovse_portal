"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    if (/^(https?:|data:image\/)/i.test(qrPath)) return qrPath;

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
        (typeof obj.mobile === "string" || typeof obj.mobile === "number")
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

function getFriendlyStatus(
    status: string,
    polling: boolean,
    loading: boolean
): string {
    const normalized = status.trim().toLowerCase();

    if (["success", "successful", "completed", "paid"].includes(normalized))
        return "Success";
    if (["failed", "failure", "error"].includes(normalized))
        return "Payment Failed";
    if (normalized === "expired") return "QR Expired";
    if (["cancelled", "canceled"].includes(normalized))
        return "Payment Cancelled";
    if (["processing", "in_process", "in progress"].includes(normalized))
        return "Processing Payment";
    if (loading && !polling) return "Preparing QR Code";
    if (polling) return "Pending";
    return "Checking Status";
}

const INTENT_INTERVAL_MS = 120_000; // 2 minutes
const STATUS_INTERVAL_MS = 3_000; // 3 seconds
const REQUEST_TIMEOUT_MS = 8_000; // 8 seconds

export default function TransactionQR() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [details, setDetails] = useState<IntentDetails | null>(null);
    const [txnId, setTxnId] = useState("");
    const [transactionStatus, setTransactionStatus] = useState("Preparing QR");
    const [customer, setCustomer] = useState<CustomerDetails | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [successCountdown, setSuccessCountdown] = useState(10);
    const [isPolling, setIsPolling] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

    const mountedRef = useRef(false);
    const currentTxnIdRef = useRef("");
    const intentInFlightRef = useRef(false);
    const statusInFlightRef = useRef(false);
    const successHandledRef = useRef(false);
    const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const statusControllerRef = useRef<AbortController | null>(null);

    const createIntent = useCallback(async (): Promise<IntentDetails | null> => {
        if (intentInFlightRef.current) return null;
        intentInFlightRef.current = true;

        if (mountedRef.current) {
            setLoading(true);
            setError("");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT_MS
        );

        try {
            if (!apiUrl) {
                throw new Error("API configuration missing. Check NEXT_PUBLIC_API_URL.");
            }

            const token = getToken();
            if (!token) {
                throw new Error("Login token not found. Please sign in again.");
            }

            const response = await fetch(`${apiUrl}/api/intent/request-intent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
                signal: controller.signal,
            });

            const result = (await response.json().catch(() => ({}))) as ApiResult;

            if (!response.ok || result.status === false) {
                throw new Error(
                    result.message || `QR request failed (HTTP ${response.status}).`
                );
            }

            const parsed = findObjectWithQr(result.data);
            const qrPath = parsed?.qr_img || parsed?.qrPath || parsed?.qr_url;

            if (!parsed || !qrPath) {
                throw new Error(
                    result.message || "QR image not found in the API response."
                );
            }

            const returnedTxnId =
                findTransactionId(result) || parsed.txn_id || parsed.txn || "";

            const updatedDetails: IntentDetails = {
                ...parsed,
                ...(returnedTxnId ? { txn_id: returnedTxnId } : {}),
            };

            if (mountedRef.current) {
                setDetails(updatedDetails);
                if (returnedTxnId) {
                    setTxnId(returnedTxnId);
                }
            }

            return updatedDetails;
        } catch (err) {
            if (mountedRef.current) {
                setError(
                    err instanceof Error
                        ? err.name === "AbortError"
                            ? "Intent request timed out. Will retry on the next cycle."
                            : err.message
                        : "Could not generate QR."
                );
            }
            return null;
        } finally {
            clearTimeout(timeoutId);
            intentInFlightRef.current = false;
            if (mountedRef.current) setLoading(false);
        }
    }, [apiUrl]);

    const stopStatusPolling = useCallback(() => {
        if (statusTimerRef.current) {
            clearTimeout(statusTimerRef.current);
            statusTimerRef.current = null;
        }

        statusControllerRef.current?.abort();
        statusControllerRef.current = null;
        statusInFlightRef.current = false;

        if (mountedRef.current) setIsPolling(false);
    }, []);

    const startStatusPolling = useCallback(
        (id: string) => {
            if (!id || !mountedRef.current || successHandledRef.current) return;

            // Do not restart if this transaction is already being polled.
            if (
                currentTxnIdRef.current === id &&
                (statusTimerRef.current || statusInFlightRef.current)
            ) {
                return;
            }

            if (statusTimerRef.current) {
                clearTimeout(statusTimerRef.current);
                statusTimerRef.current = null;
            }

            statusControllerRef.current?.abort();
            statusControllerRef.current = null;
            statusInFlightRef.current = false;

            currentTxnIdRef.current = id;
            setTxnId(id);
            setIsPolling(true);
            setTransactionStatus("Pending");

            const checkStatus = async (): Promise<void> => {
                if (
                    !mountedRef.current ||
                    successHandledRef.current ||
                    currentTxnIdRef.current !== id
                ) {
                    return;
                }

                // Prevent overlapping status requests.
                if (statusInFlightRef.current) {
                    statusTimerRef.current = setTimeout(
                        () => void checkStatus(),
                        STATUS_INTERVAL_MS
                    );
                    return;
                }

                statusInFlightRef.current = true;
                const controller = new AbortController();
                statusControllerRef.current = controller;

                const timeoutId = setTimeout(
                    () => controller.abort(),
                    REQUEST_TIMEOUT_MS
                );

                let shouldContinue = true;

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
                            headers: { Authorization: `Bearer ${token}` },
                            cache: "no-store",
                            signal: controller.signal,
                        }
                    );

                    const result = (await response.json().catch(() => ({}))) as ApiResult;

                    if (!response.ok) {
                        throw new Error(
                            result.message ||
                            `Status request failed (HTTP ${response.status}).`
                        );
                    }

                    if (
                        !mountedRef.current ||
                        currentTxnIdRef.current !== id ||
                        successHandledRef.current
                    ) {
                        return;
                    }

                    const customerDetails = findCustomerDetails(result);
                    if (customerDetails) setCustomer(customerDetails);

                    const status = findTransactionStatus(result);
                    const responseMessage = String(result.message || "").toLowerCase();

                    const scannerConfirmed =
                        result.status === true &&
                        Boolean(customerDetails) &&
                        (responseMessage.includes("intent") ||
                            responseMessage.includes("success"));

                    const transactionConfirmed = [
                        "success",
                        "successful",
                        "completed",
                        "paid",
                    ].includes(status);

                    if (transactionConfirmed || scannerConfirmed) {
                        successHandledRef.current = true;
                        shouldContinue = false;
                        setTransactionStatus("Success");
                        setPaymentSuccess(true);
                        setSuccessCountdown(10);
                        setError("");
                        setTxnId(findTransactionId(result) || id);
                        setIsPolling(false);

                        if (intentTimerRef.current) {
                            clearInterval(intentTimerRef.current);
                            intentTimerRef.current = null;
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
                        shouldContinue = false;
                        setIsPolling(false);
                        setTransactionStatus(status);
                        setError(`Transaction ${status}. Please try again if needed.`);
                        return;
                    }

                    setTransactionStatus(status || "Pending");
                    setError("");
                } catch (err) {
                    if (
                        mountedRef.current &&
                        currentTxnIdRef.current === id &&
                        !successHandledRef.current
                    ) {
                        setError(
                            err instanceof Error
                                ? err.name === "AbortError"
                                    ? "Status request timed out. Retrying..."
                                    : err.message
                                : "Status check failed. Retrying..."
                        );
                    }
                } finally {
                    clearTimeout(timeoutId);

                    if (statusControllerRef.current === controller) {
                        statusControllerRef.current = null;
                    }
                    statusInFlightRef.current = false;

                    if (
                        shouldContinue &&
                        mountedRef.current &&
                        !successHandledRef.current &&
                        currentTxnIdRef.current === id
                    ) {
                        statusTimerRef.current = setTimeout(
                            () => void checkStatus(),
                            STATUS_INTERVAL_MS
                        );
                    }
                }
            };

            // First status request starts immediately for the new transaction.
            void checkStatus();
        },
        [apiUrl]
    );

    useEffect(() => {
        mountedRef.current = true;
        successHandledRef.current = false;

        let disposed = false;

        const initialize = async () => {
            setPaymentSuccess(false);
            setCustomer(null);
            setError("");
            setTransactionStatus("Preparing QR");

            const initialIntent = await createIntent();
            if (disposed || !mountedRef.current || !initialIntent) return;

            const initialId = initialIntent.txn_id || initialIntent.txn;
            if (!initialId) {
                setTransactionStatus("Checking Status");
                setError(
                    "Intent API response mein txn_id nahi mila. API response check karein."
                );
            } else {
                startStatusPolling(initialId);
            }

            // Request a fresh intent every 2 minutes, independently of status polling.
            intentTimerRef.current = setInterval(async () => {
                if (
                    disposed ||
                    !mountedRef.current ||
                    successHandledRef.current ||
                    intentInFlightRef.current
                ) {
                    return;
                }

                const newIntent = await createIntent();
                if (disposed || !mountedRef.current || !newIntent) return;

                const newId = newIntent.txn_id || newIntent.txn;
                if (newId && newId !== currentTxnIdRef.current) {
                    startStatusPolling(newId);
                }
            }, INTENT_INTERVAL_MS);
        };

        void initialize();

        return () => {
            disposed = true;
            mountedRef.current = false;

            if (intentTimerRef.current) {
                clearInterval(intentTimerRef.current);
                intentTimerRef.current = null;
            }

            if (statusTimerRef.current) {
                clearTimeout(statusTimerRef.current);
                statusTimerRef.current = null;
            }

            statusControllerRef.current?.abort();
            statusControllerRef.current = null;
            statusInFlightRef.current = false;
        };
    }, [createIntent, startStatusPolling]);

    useEffect(() => {
        if (!paymentSuccess) return;

        setSuccessCountdown(10);
        let remaining = 10;

        const intervalId = window.setInterval(() => {
            remaining -= 1;
            setSuccessCountdown(remaining);

            if (remaining <= 0) {
                window.clearInterval(intervalId);
                window.location.reload();
            }
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [paymentSuccess]);

    const qrPath = details?.qr_img || details?.qrPath || details?.qr_url;
    const qrImageUrl =
        qrPath && apiUrl ? resolveQrUrl(String(qrPath), apiUrl) : "";

    return (
        <div>
            {paymentSuccess && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="payment-success-title"
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
                >
                    <div className="relative my-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-emerald-950/20">
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-white" />
                        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[18px] border-emerald-200/40" />
                        <div className="absolute -left-8 top-16 h-16 w-16 rounded-full bg-teal-100/60 blur-sm" />

                        <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                                <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" aria-hidden="true">
                                    <path d="m5 12.5 4.3 4.3L19.5 6.8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div className="mt-4 text-center">
                                <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Confirmed
                                </div>
                                <h2 id="payment-success-title" className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                    Successful!
                                </h2>
                                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                    Your transaction has been verified successfully.
                                </p>
                            </div>

                            {customer && (
                                <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 text-left">
                                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-800">Customer details</p>
                                    <p className="text-xs text-slate-500">Customer name</p>
                                    <p className="mt-0.5 break-words text-base font-bold text-slate-900">{customer.name}</p>
                                    <p className="mt-3 text-xs text-slate-500">Mobile number</p>
                                    <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">{customer.mobile}</p>
                                </div>
                            )}

                            {txnId && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Transaction ID</p>
                                    <p className="mt-1 break-all font-mono text-xs text-slate-700">{txnId}</p>
                                </div>
                            )}

                            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-400 transition-all duration-1000"
                                    style={{ width: `${Math.max(0, Math.min(100, (successCountdown / 10) * 100))}%` }}
                                />
                            </div>
                            <p className="mt-2 text-center text-xs text-slate-500">
                                Refreshing in {successCountdown} seconds...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <section className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-700">
                        ▦
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-950">Scan QR Code</h2>
                    </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50/40 p-3 sm:p-4">
                    {details && qrPath ? (
                        <div className="flex flex-col items-center">
                            <div className="rounded-2xl border border-white bg-white shadow-sm ring-1 ring-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={qrImageUrl}
                                    alt="Transaction QR code"
                                    className="h-[min(288px,75vw)] w-[min(288px,75vw)] object-contain sm:h-80 sm:w-80 lg:h-96 lg:w-96"
                                    onError={() =>
                                        setError(`QR image could not be loaded. Check the backend static path: ${qrImageUrl}`)
                                    }
                                />
                            </div>

                            <div className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                                {paymentSuccess ? (
                                    <div className="text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">✓</div>
                                        <h3 className="mt-3 text-lg font-bold text-emerald-700">Successful!</h3>
                                        <p className="mt-1 text-sm text-slate-500">Your transaction has been verified successfully.</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs font-medium text-slate-500">Current status</p>
                                        <div className={`mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 ${["success", "successful", "completed", "paid"].includes(transactionStatus.toLowerCase())
                                            ? "bg-emerald-50 text-emerald-800"
                                            : ["failed", "failure", "error"].includes(transactionStatus.toLowerCase())
                                                ? "bg-rose-50 text-rose-800"
                                                : "bg-amber-50 text-amber-950"
                                            }`}>
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">◷</span>
                                            <span className="font-bold">
                                                {getFriendlyStatus(transactionStatus, isPolling, loading)}
                                            </span>
                                        </div>

                                        {customer && (
                                            <div className="mt-4 rounded-xl border border-slate-200 p-3">
                                                <p className="text-xs text-slate-500">Customer Name</p>
                                                <p className="mt-1 break-words font-semibold text-slate-900">{customer.name}</p>
                                                <p className="mt-3 text-xs text-slate-500">Mobile Number</p>
                                                <p className="mt-1 font-semibold text-slate-900">{customer.mobile}</p>
                                            </div>
                                        )}

                                        {txnId && (
                                            <p className="mt-2 break-all text-center text-xs text-slate-400">
                                                Transaction ID: {txnId}
                                            </p>
                                        )}
                                        <p className="mt-2 text-center text-xs text-slate-400">Please do not close this page.</p>
                                    </>
                                )}


                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl text-teal-700 shadow-sm ring-1 ring-slate-200">▦</div>
                            <p className="mt-5 text-base font-semibold text-slate-900">
                                {loading ? "Generating your QR..." : "Preparing QR code"}
                            </p>
                            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                {loading
                                    ? "Please wait while we prepare your secure payment QR code."
                                    : "Your QR code will appear here once it is ready. Please try again in a moment if it does not appear."}
                            </p>
                            {loading && (
                                <div className="mt-5 h-6 w-6 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
                            )}
                            {error && (
                                <p role="alert" className="mt-3 break-words text-sm text-rose-600">{error}</p>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
