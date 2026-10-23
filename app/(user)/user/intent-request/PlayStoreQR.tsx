"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const androidStoreUrl =
    "https://play.google.com/store/apps/details?id=in.gov.uidai.pehchaan";

const iosStoreUrl =
    "https://apps.apple.com/in/app/aadhaar/id6744029871";

type QRs = {
    android: string;
    ios: string;
};

type SelectedQR = {
    title: string;
    image: string;
    url: string;
} | null;

export default function PlayStoreQR() {
    const [qrCodes, setQrCodes] = useState<QRs>({
        android: "",
        ios: "",
    });

    const [isOpen, setIsOpen] = useState(true);
    const [selectedQR, setSelectedQR] = useState<SelectedQR>(null);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            QRCode.toDataURL(androidStoreUrl, {
                errorCorrectionLevel: "H",
                margin: 2,
                width: 400,
                color: {
                    dark: "#0f172a",
                    light: "#ffffff",
                },
            }),
            QRCode.toDataURL(iosStoreUrl, {
                errorCorrectionLevel: "H",
                margin: 2,
                width: 400,
                color: {
                    dark: "#0f172a",
                    light: "#ffffff",
                },
            }),
        ])
            .then(([android, ios]) => {
                if (!cancelled) {
                    setQrCodes({ android, ios });
                }
            })
            .catch((error) => {
                console.error("QR generation failed:", error);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Close the popup when the user presses Escape.
    useEffect(() => {
        if (!selectedQR) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedQR(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedQR]);

    return (
        <>
            {/* Floating download panel */}
            <aside
                className="
                    fixed bottom-3 right-3 z-40
                    w-[min(290px,calc(100vw-24px))]
                    rounded-2xl border border-slate-200
                    bg-white p-3 shadow-xl
                    sm:bottom-4 sm:right-4 sm:w-[310px]
                "
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className="
                                flex h-10 w-10 shrink-0 items-center
                                justify-center rounded-xl
                                bg-teal-50 text-teal-700
                            "
                            aria-hidden="true"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-6 w-6"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <path d="m7 10 5 5 5-5" />
                                <path d="M12 15V3" />
                            </svg>
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-sm font-extrabold leading-5 text-slate-900">
                                Download Aadhaar
                            </h3>

                            {isOpen && (
                                <p className="text-xs font-medium text-slate-500">
                                    Official App
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Expand/collapse button */}
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-expanded={isOpen}
                        aria-label={
                            isOpen
                                ? "Close app download QR codes"
                                : "Open app download QR codes"
                        }
                        className="
                            flex h-10 w-10 shrink-0 items-center
                            justify-center rounded-xl
                            border border-slate-200 bg-slate-50
                            text-slate-700 transition
                            hover:border-teal-300 hover:bg-teal-50
                            hover:text-teal-700
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-teal-600
                        "
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"
                                }`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                </div>

                {/* Android and Apple QR codes */}
                {isOpen && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {/* Android */}
                        <div
                            className="
                                flex min-w-0 flex-col items-center
                                rounded-xl border border-slate-200
                                bg-slate-50 p-2 text-center
                                transition hover:border-emerald-300
                                hover:bg-emerald-50
                            "
                        >
                            <span className="text-xs font-bold text-slate-800">
                                For Android
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    qrCodes.android &&
                                    setSelectedQR({
                                        title: "Download Aadhaar for Android",
                                        image: qrCodes.android,
                                        url: androidStoreUrl,
                                    })
                                }
                                disabled={!qrCodes.android}
                                aria-label="Enlarge Android QR code"
                                className="
                                    mt-1.5 flex h-[76px] w-[76px]
                                    items-center justify-center rounded-lg
                                    border border-slate-200 bg-white p-1
                                    cursor-zoom-in
                                    disabled:cursor-wait
                                "
                            >
                                {qrCodes.android ? (
                                    <img
                                        src={qrCodes.android}
                                        alt="Android app download QR code"
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <span
                                        className="
                                            h-5 w-5 animate-spin rounded-full
                                            border-2 border-slate-200
                                            border-t-teal-700
                                        "
                                        aria-label="Generating QR code"
                                    />
                                )}
                            </button>

                            <a
                                href={androidStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 text-[10px] font-medium text-slate-500 hover:text-teal-700"
                            >
                                Google Play
                            </a>
                        </div>

                        {/* Apple */}
                        <div
                            className="
                                flex min-w-0 flex-col items-center
                                rounded-xl border border-slate-200
                                bg-slate-50 p-2 text-center
                                transition hover:border-slate-300
                                hover:bg-slate-100
                            "
                        >
                            <span className="text-xs font-bold text-slate-800">
                                For Apple
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    qrCodes.ios &&
                                    setSelectedQR({
                                        title: "Download Aadhaar for Apple",
                                        image: qrCodes.ios,
                                        url: iosStoreUrl,
                                    })
                                }
                                disabled={!qrCodes.ios}
                                aria-label="Enlarge Apple QR code"
                                className="
                                    mt-1.5 flex h-[76px] w-[76px]
                                    items-center justify-center rounded-lg
                                    border border-slate-200 bg-white p-1
                                    cursor-zoom-in
                                    disabled:cursor-wait
                                "
                            >
                                {qrCodes.ios ? (
                                    <img
                                        src={qrCodes.ios}
                                        alt="Apple app download QR code"
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <span
                                        className="
                                            h-5 w-5 animate-spin rounded-full
                                            border-2 border-slate-200
                                            border-t-teal-700
                                        "
                                        aria-label="Generating QR code"
                                    />
                                )}
                            </button>

                            <a
                                href={iosStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 text-[10px] font-medium text-slate-500 hover:text-teal-700"
                            >
                                App Store
                            </a>
                        </div>
                    </div>
                )}
            </aside>

            {/* Large QR code popup */}
            {selectedQR && (
                <div
                    className="
                        fixed inset-0 z-[100]
                        flex items-center justify-center
                        overflow-y-auto bg-black/60
                        p-4 backdrop-blur-sm
                    "
                    onClick={() => setSelectedQR(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="qr-popup-title"
                        className="
                            relative w-full max-w-sm
                            rounded-2xl border border-slate-200
                            bg-white p-5 text-center shadow-2xl
                            sm:p-7
                        "
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Close icon */}
                        <button
                            type="button"
                            onClick={() => setSelectedQR(null)}
                            aria-label="Close QR code popup"
                            className="
                                absolute right-3 top-3
                                flex h-10 w-10 items-center
                                justify-center rounded-full
                                bg-slate-100 text-2xl
                                text-slate-700 transition
                                hover:bg-slate-200
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-teal-600
                            "
                        >
                            &times;
                        </button>

                        <div
                            className="
                                mx-auto mb-3 flex h-12 w-12
                                items-center justify-center
                                rounded-xl bg-teal-50 text-teal-700
                            "
                            aria-hidden="true"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7"
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="7"
                                    height="7"
                                    rx="1"
                                />
                                <rect
                                    x="14"
                                    y="3"
                                    width="7"
                                    height="7"
                                    rx="1"
                                />
                                <rect
                                    x="3"
                                    y="14"
                                    width="7"
                                    height="7"
                                    rx="1"
                                />
                                <path d="M14 14h3v3h-3zM20 14v2M14 20h2M20 19v2" />
                            </svg>
                        </div>

                        <h2
                            id="qr-popup-title"
                            className="
                                mb-2 pr-5 text-lg
                                font-extrabold text-slate-900
                                sm:text-xl
                            "
                        >
                            {selectedQR.title}
                        </h2>

                        {/* <p className="mb-5 text-sm text-slate-500">
                            Scan this QR code with your phone camera to open
                            the app store.
                        </p> */}

                        {/* Large QR code */}
                        <div
                            className="
                                mx-auto flex w-fit items-center
                                justify-center rounded-2xl
                                border border-slate-200
                                bg-white p-3 shadow-sm
                            "
                        >
                            <img
                                src={selectedQR.image}
                                alt={`${selectedQR.title} QR code`}
                                className="
                                    h-60 w-60 object-contain
                                    sm:h-64 sm:w-64
                                "
                            />
                        </div>

                        {/* <p className="mt-4 text-xs text-slate-500">
                            Point your phone camera at the QR code.
                        </p> */}

                        {/* <a
                            href={selectedQR.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                mt-5 flex w-full items-center
                                justify-center rounded-xl
                                bg-teal-700 px-4 py-3
                                text-sm font-bold text-white
                                transition hover:bg-teal-800
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-teal-600
                                focus-visible:ring-offset-2
                            "
                        >
                            Open App Store
                        </a> */}

                        {/* <button
                            type="button"
                            onClick={() => setSelectedQR(null)}
                            className="
                                mt-2 w-full rounded-xl
                                border border-slate-200
                                bg-white px-4 py-3
                                text-sm font-semibold
                                text-slate-700 transition
                                hover:bg-slate-50
                            "
                        >
                            Close
                        </button> */}
                    </div>
                </div>
            )}
        </>
    );
}
