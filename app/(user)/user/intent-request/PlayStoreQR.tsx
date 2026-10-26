
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QRs = {
    android: string;
    ios: string;
};

type SelectedQR = {
    title: string;
    image: string;
    url: string;
} | null;

const androidStoreUrl =
    "https://play.google.com/store/apps/details?id=in.gov.uidai.pehchaan";

const iosStoreUrl =
    "https://apps.apple.com/in/app/aadhaar/id6744029871";

const aadhaarLogo = "/aadhaar-logo.webp";

export default function PlayStoreQR() {
    const [qrCodes, setQrCodes] = useState<QRs>({
        android: "",
        ios: "",
    });

    const [selectedQR, setSelectedQR] =
        useState<SelectedQR>(null);

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

    useEffect(() => {
        if (!selectedQR) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedQR(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedQR]);

    const card =
        "group flex w-[calc(50vw-18px)] max-w-[190px] flex-col items-center rounded-2xl border border-white/90 p-2.5 text-center shadow-[0_12px_30px_rgba(40,80,160,0.15)] backdrop-blur sm:w-[190px] sm:p-3.5";

    const logoClass =
        " h-8 w-8 max-w-full object-contain sm:h-12";

    const qrButton =
        "mt-2 flex h-[66px] w-[66px] items-center justify-center rounded-xl border border-slate-100 bg-white p-1 shadow-sm transition hover:scale-105 disabled:opacity-60 sm:h-[78px] sm:w-[78px]";

    const renderCard = (platform: "android" | "ios") => {
        const isAndroid = platform === "android";
        const qr = qrCodes[platform];
        const url = isAndroid ? androidStoreUrl : iosStoreUrl;
        const title = isAndroid ? "Android" : "Apple / iPhone";

        return (
            <aside
                key={platform}
                aria-label={`${title} app download`}
                style={{
                    position: "fixed",
                    left: isAndroid ? "12px" : "auto",
                    right: isAndroid ? "auto" : "12px",
                    bottom: "12px",
                    zIndex: 40,
                }}
                className={`${card} ${isAndroid
                    ? "bg-emerald-50/95"
                    : "bg-blue-50/95"
                    } `}
            >
                {/* Top accent */}
                <div
                    className={`mb - 2 h - 1 w - full rounded - full ${isAndroid ? "bg-emerald-500" : "bg-blue-600"
                        } `}
                />

                {/* QR code */}
                <button
                    type="button"
                    onClick={() => {
                        if (!qr) return;

                        setSelectedQR({
                            title: `Download Aadhaar for ${title}`,
                            image: qr,
                            url,
                        });
                    }}
                    disabled={!qr}
                    aria-label={`Enlarge ${title} QR code`}
                    className={qrButton}
                >
                    {qr ? (
                        <img
                            src={qr}
                            alt={`${title} app download QR code`}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span
                            className={`h - 5 w - 5 animate - spin rounded - full border - 2 border - slate - 200 ${isAndroid
                                ? "border-t-emerald-600"
                                : "border-t-blue-600"
                                } `}
                        />
                    )}
                </button>


                {/* Aadhaar logo */}
                <img
                    src={aadhaarLogo}
                    alt="Aadhaar logo"
                    className={logoClass}
                    onError={(event) => {
                        event.currentTarget.style.display = "none";
                    }}
                />
                <p className=" text-center text-[9px] font-extrabold  sm:text-[10px]">Aadhaar App</p>

                {/* Platform name */}
                <div className="flex mt-1 items-center justify-center gap-1.5">
                    {isAndroid ? (
                        <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-emerald-600"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M7 2.5 8.5 5A8 8 0 0 1 12 4.2c1.3 0 2.5.3 3.5.8L17 2.5l1.1.6-1.5 2.5A7.7 7.7 0 0 1 20 12H4a7.7 7.7 0 0 1 3.4-6.4L5.9 3.1 7 2.5ZM8 8.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM4 13h16v5a2 2 0 0 1-2 2h-1v2h-2v-2h-6v2H7v-2H6a2 2 0 0 1-2-2v-5Z" />
                        </svg>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-blue-700"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M16.37 12.23c.02 2.18 1.91 2.9 1.93 2.91-.02.05-.3 1.05-.99 2.08-.6.89-1.23 1.78-2.22 1.8-.97.02-1.28-.58-2.39-.58-1.1 0-1.45.56-2.37.6-.95.04-1.67-.96-2.27-1.84-1.23-1.78-2.17-5.02-.91-7.22.63-1.09 1.75-1.78 2.96-1.8.92-.02 1.79.63 2.36.63.57 0 1.63-.78 2.75-.67.47.02 1.79.19 2.63 1.44-.07.04-1.57.92-1.55 2.65ZM14.56 6.31a3.2 3.2 0 0 0 .75-2.3 3.28 3.28 0 0 0-2.12 1.08 3.03 3.03 0 0 0-.77 2.22 2.72 2.72 0 0 0 2.14-1Z" />
                        </svg>
                    )}

                    <h2 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                        {title}
                    </h2>
                </div>

                {/* Instructions */}
                <p className="mt-2 text-center text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500 sm:text-[8px]">
                    Scan to download app
                </p>





            </aside>
        );
    };

    return (
        <>
            {renderCard("android")}
            {renderCard("ios")}

            {/* Enlarged QR popup */}
            {selectedQR && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedQR(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="qr-popup-title"
                        className="relative w-full max-w-sm rounded-3xl border border-white bg-white p-5 text-center shadow-2xl sm:p-7"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedQR(null)}
                            aria-label="Close QR popup"
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700 hover:bg-slate-200"
                        >
                            ×
                        </button>

                        <img
                            src={aadhaarLogo}
                            alt="Aadhaar logo"
                            className="mx-auto mb-4 h-12 w-auto object-contain"
                            onError={(event) => {
                                event.currentTarget.style.display = "none";
                            }}
                        />

                        <h2
                            id="qr-popup-title"
                            className="mb-2 pr-5 text-lg font-extrabold text-slate-900 sm:text-xl"
                        >
                            {selectedQR.title}
                        </h2>

                        <p className="mb-4 text-sm text-slate-500">
                            Scan this QR code to download the app
                        </p>

                        <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <img
                                src={selectedQR.image}
                                alt={`${selectedQR.title} QR code`}
                                className="h-60 w-60 object-contain sm:h-64 sm:w-64"
                            />
                        </div>



                    </div>
                </div>
            )}
        </>
    );
}
