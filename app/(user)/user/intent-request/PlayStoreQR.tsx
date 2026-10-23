"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QRs = { android: string; ios: string };
type SelectedQR = { title: string; image: string; url: string } | null;

const androidStoreUrl =
    "https://play.google.com/store/apps/details?id=in.gov.uidai.pehchaan";
const iosStoreUrl = "https://apps.apple.com/in/app/aadhaar/id6744029871";

export default function PlayStoreQR() {
    const [qrCodes, setQrCodes] = useState<QRs>({ android: "", ios: "" });
    const [selectedQR, setSelectedQR] = useState<SelectedQR>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            QRCode.toDataURL(androidStoreUrl, {
                errorCorrectionLevel: "H",
                margin: 2,
                width: 400,
                color: { dark: "#0f172a", light: "#ffffff" },
            }),
            QRCode.toDataURL(iosStoreUrl, {
                errorCorrectionLevel: "H",
                margin: 2,
                width: 400,
                color: { dark: "#0f172a", light: "#ffffff" },
            }),
        ])
            .then(([android, ios]) => {
                if (!cancelled) setQrCodes({ android, ios });
            })
            .catch((error) => console.error("QR generation failed:", error));

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedQR) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setSelectedQR(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedQR]);

    const panelClass =
        "fixed bottom-3 z-40 w-[calc(50vw-18px)] max-w-[190px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:bottom-4 sm:w-[190px] sm:p-3";
    const qrButtonClass =
        "mt-2 flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-white p-1 cursor-zoom-in disabled:cursor-wait sm:h-20 sm:w-20";

    return (
        <>
            {/* Android: bottom-left */}
            <aside className={`${panelClass} left-3`} aria-label="Android app download">
                <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-extrabold text-slate-900 sm:text-sm">🤖 Android</span>
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
                        className={qrButtonClass}
                    >
                        {qrCodes.android ? (
                            <img src={qrCodes.android} alt="Android app download QR code" className="h-full w-full object-contain" />
                        ) : (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" aria-label="Generating QR code" />
                        )}
                    </button>
                    <a href={androidStoreUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-[10px] font-semibold text-slate-600 hover:text-emerald-700 sm:text-xs">
                        Google Play
                    </a>
                </div>
            </aside>

            {/* Apple: bottom-right */}
            <aside className={`${panelClass} right-3`} aria-label="Apple app download">
                <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-extrabold text-slate-900 sm:text-sm"> Apple / iPhone</span>
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
                        className={qrButtonClass}
                    >
                        {qrCodes.ios ? (
                            <img src={qrCodes.ios} alt="Apple app download QR code" className="h-full w-full object-contain" />
                        ) : (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" aria-label="Generating QR code" />
                        )}
                    </button>
                    <a href={iosStoreUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-[10px] font-semibold text-slate-600 hover:text-slate-900 sm:text-xs">
                        App Store
                    </a>
                </div>
            </aside>

            {/* Enlarged QR popup */}
            {selectedQR && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedQR(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="qr-popup-title"
                        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-2xl sm:p-7"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedQR(null)}
                            aria-label="Close QR code popup"
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700 hover:bg-slate-200"
                        >
                            &times;
                        </button>
                        <h2 id="qr-popup-title" className="mb-4 pr-5 text-lg font-extrabold text-slate-900 sm:text-xl">
                            {selectedQR.title}
                        </h2>
                        <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <img src={selectedQR.image} alt={`${selectedQR.title} QR code`} className="h-60 w-60 object-contain sm:h-64 sm:w-64" />
                        </div>
                        <a href={selectedQR.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:underline">
                            Open store link
                        </a>
                    </div>
                </div>
            )}
        </>
    );
}
