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


function getFriendlyStatus(status: string, polling: boolean, loading: boolean): string {
    const normalized = status.trim().toLowerCase();
    if (["success", "successful", "completed", "paid"].includes(normalized)) return "Success";
    if (["failed", "failure"].includes(normalized)) return "Payment Failed";
    if (["expired"].includes(normalized)) return "QR Expired";
    if (["cancelled", "canceled"].includes(normalized)) return "Payment Cancelled";
    if (["processing", "in_process", "in progress"].includes(normalized)) return "Processing Payment";
    if (loading && !polling) return "Preparing QR Code";
    if (polling) return "Pending";
    return "Checking Status";
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
            }, 3000);
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

                // Some scanner/status API responses confirm a successful scan by
                // returning status:true with the customer details, even when they
                // do not include a separate payment_status field.
                const responseMessage = String(result.message || "").toLowerCase();
                const scannerConfirmed =
                    result.status === true &&
                    Boolean(customerDetails) &&
                    (responseMessage.includes("intent") || responseMessage.includes("success"));

                const transactionConfirmed =
                    ["success", "successful", "completed", "paid"].includes(status);

                setTransactionStatus(
                    transactionConfirmed || scannerConfirmed ? "Success" : status || "Pending"
                );

                // Open the success popup for an explicit transaction success, or
                // the scanner's successful response containing customer details.
                if (transactionConfirmed || scannerConfirmed) {
                    successHandled.current = true;
                    setIsPolling(false);
                    setPaymentSuccess(true);
                    setSuccessCountdown(10);
                    setTransactionStatus("Success");
                    setError("");

                    const successfulTxnId = findTransactionId(result) || id;
                    setTxnId(successfulTxnId);
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
                setTransactionStatus("Checking Status");
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


    // Keep the success popup visible for 10 seconds, then refresh the page automatically.
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
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />  confirmed
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
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                                            {customer.name.trim().charAt(0).toUpperCase() || "C"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-500">Customer name</p>
                                            <p className="mt-0.5 break-words text-base font-bold text-slate-900">{customer.name}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-3 border-t border-emerald-100 pt-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                                                <path d="M7.2 3.8h2.4l1.2 4-1.7 1.5a14 14 0 0 0 5.6 5.6l1.5-1.7 4 1.2v2.4a2 2 0 0 1-2.1 2A16.1 16.1 0 0 1 5.2 5.9a2 2 0 0 1 2-2.1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-500">Mobile number</p>
                                            <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">{customer.mobile}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {txnId && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Transaction ID</p>
                                    <p className="mt-1 break-all font-mono text-xs text-slate-700">{txnId}</p>
                                </div>
                            )}

                            <div className="mt-5 rounded-2xl   text-white">

                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, (successCountdown / 10) * 100))}%` }} />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Right panel: live transaction QR and status logic. */}
            <section className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-700">
                        ▦
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-950">
                            Scan QR Code
                        </h2>

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
                                        setError(
                                            `QR image could not be loaded. Check the backend static path: ${qrImageUrl}`
                                        )
                                    }
                                />
                            </div>

                            <div className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                                {paymentSuccess ? (
                                    <div className="text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                                            ✓
                                        </div>
                                        <h3 className="mt-3 text-lg font-bold text-emerald-700">
                                            Successful!
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Your transaction has been verified successfully.
                                        </p>

                                        {customer && (
                                            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-left">
                                                <p className="text-xs text-slate-500">Customer Name</p>
                                                <p className="mt-1 break-words font-semibold text-slate-900">{customer.name}</p>
                                                <p className="mt-3 text-xs text-slate-500">Mobile Number</p>
                                                <p className="mt-1 font-semibold text-slate-900">{customer.mobile}</p>
                                            </div>
                                        )}


                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs font-medium text-slate-500">Current status</p>
                                        <div className={`mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 ${["success", "successful", "completed", "paid"].includes(transactionStatus.toLowerCase())
                                            ? "bg-emerald-50 text-emerald-800"
                                            : ["failed", "failure"].includes(transactionStatus.toLowerCase())
                                                ? "bg-rose-50 text-rose-800"
                                                : "bg-amber-50 text-amber-950"
                                            }`}>
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${["success", "successful", "completed", "paid"].includes(transactionStatus.toLowerCase())
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700"
                                                }`}>◷</span>
                                            <span className="font-bold">
                                                {customer ? "Success" : getFriendlyStatus(transactionStatus, isPolling, loading)}
                                            </span>
                                            {/* {(isPolling || loading) && (
                                                <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-800" />
                                            )} */}
                                        </div>

                                        {customer && (
                                            <div className="mt-4 rounded-xl border border-slate-200 p-3">
                                                <p className="text-xs text-slate-500">Customer Name</p>
                                                <p className="mt-1 break-words font-semibold text-slate-900">{customer.name}</p>
                                                <p className="mt-3 text-xs text-slate-500">Mobile Number</p>
                                                <p className="mt-1 font-semibold text-slate-900">{customer.mobile}</p>
                                            </div>
                                        )}

                                        <p className="mt-2 text-center text-xs text-slate-400">
                                            Please do not close this page.
                                        </p>

                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl text-teal-700 shadow-sm ring-1 ring-slate-200">
                                ▦
                            </div>
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
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
