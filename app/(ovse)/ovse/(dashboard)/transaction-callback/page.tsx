"use client";

import { FormEvent, useState } from "react";
import { authorizedFetch } from "@/app/lib/api-client";

type CallbackResult = {
    txnId: string;
    responseCode: string;
    responseMsg: string;
    raw: string;
};

const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function escapeXml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function readXmlTag(xml: string, tag: string): string {
    const safeTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = xml.match(new RegExp(`<${safeTag}\\b[^>]*>([\\s\\S]*?)</${safeTag}>`, "i"));
    return match?.[1]?.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim() ?? "";
}

export default function CallbackCapturePage() {
    const [txnId, setTxnId] = useState("");
    const [credential, setCredential] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<CallbackResult | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;
        setError("");
        setResult(null);
        setLoading(true);

        const xmlBody = `<Request>\n  <TxnID>${escapeXml(txnId.trim())}</TxnID>\n  <Credential>${escapeXml(credential.trim())}</Credential>\n</Request>`;

        try {
            const response = await authorizedFetch("/api/callback/capture-disclosure/", {
                method: "POST",
                headers: { "Content-Type": "application/xml", Accept: "application/xml, text/xml, */*" },
                body: xmlBody,
            });
            const raw = await response.text();
            const responseCode = readXmlTag(raw, "ResponseCode");
            const responseMsg = readXmlTag(raw, "ResponseMsg");
            const returnedTxnId = readXmlTag(raw, "TxnID");

            if (!response.ok || (responseCode && responseCode !== "200")) {
                throw new Error(responseMsg || `Request failed (${response.status}).`);
            }

            setResult({
                txnId: returnedTxnId || txnId.trim(),
                responseCode: responseCode || String(response.status),
                responseMsg: responseMsg || "Request processed.",
                raw,
            });
            setCredential("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Callback request failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const succeeded = result?.responseCode === "200" || result?.responseMsg.toLowerCase().includes("success");

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-7 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
                            <span className="h-2 w-2 rounded-full bg-blue-500" /> Admin Console <span className="text-blue-300">/</span> Callback Capture
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Capture Disclosure</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Submit the transaction ID and credential to the callback API. The API response appears here without opening a separate details page.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:self-auto">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> POST API
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-5 py-5 dark:border-slate-800 dark:from-blue-950/40 dark:to-slate-900 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v6h5M8 14h8M8 17h6" /></svg>
                                </div>
                                <div><h2 className="font-bold text-slate-900 dark:text-white">Request details</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">XML payload · Bearer authorization</p></div>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                            <div>
                                <label htmlFor="txn-id" className="text-sm font-semibold text-slate-800 dark:text-slate-200">Transaction ID <span className="text-rose-500">*</span></label>
                                <input id="txn-id" className={inputClass} value={txnId} onChange={(e) => setTxnId(e.target.value)} required placeholder="Enter transaction UUID" autoComplete="off" />
                                <p className="mt-1.5 text-xs text-slate-500">The transaction identifier sent inside the XML Request.</p>
                            </div>
                            <div>
                                <label htmlFor="credential" className="text-sm font-semibold text-slate-800 dark:text-slate-200">Credential <span className="text-rose-500">*</span></label>
                                <textarea id="credential" className={`${inputClass} min-h-36 resize-y font-mono text-xs leading-5`} value={credential} onChange={(e) => setCredential(e.target.value)} required placeholder="Paste the credential XML value here" autoComplete="off" spellCheck={false} />
                                <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">Sensitive data: entered credential is not saved in this page and is cleared after a successful request.</p>
                            </div>
                            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><p className="font-semibold">Request failed</p><p className="mt-1 break-words">{error}</p></div>}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                <button type="button" onClick={() => { setTxnId(""); setCredential(""); setError(""); setResult(null); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Clear form</button>
                                <button type="submit" disabled={loading || !txnId.trim() || !credential.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                                    {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending request...</> : <>Send callback <span aria-hidden="true">→</span></>}
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="space-y-4">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                            <h2 className="font-bold text-slate-900 dark:text-white">Response</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">API status and returned transaction details.</p>
                            {!result ? (
                                <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center dark:border-slate-700 dark:bg-slate-950/50">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M8 3h8v4H8zM8 12h8M8 16h5" /></svg></div>
                                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Waiting for response</p>
                                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Fill in the request and select Send callback. The response will be shown here.</p>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    <div className={`rounded-xl border p-4 ${succeeded ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}>
                                        <div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${succeeded ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>{succeeded ? "✓" : "!"}</span><span className={`text-sm font-bold ${succeeded ? "text-emerald-800 dark:text-emerald-200" : "text-amber-800 dark:text-amber-200"}`}>{succeeded ? "Callback successful" : "Callback response received"}</span></div>
                                        <p className={`mt-2 text-sm ${succeeded ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>{result.responseMsg}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><p className="text-xs text-slate-500">Response code</p><p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{result.responseCode || "—"}</p></div>
                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><p className="text-xs text-slate-500">Result</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{succeeded ? "Success" : "Review"}</p></div>
                                    </div>
                                    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction ID</p><p className="mt-1 break-all rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">{result.txnId || "—"}</p><button type="button" onClick={() => void navigator.clipboard?.writeText(result.txnId)} disabled={!result.txnId} className="mt-2 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-40 dark:text-blue-400">Copy transaction ID</button></div>
                                    <details className="rounded-xl border border-slate-200 dark:border-slate-700"><summary className="cursor-pointer px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">View raw XML response</summary><pre className="max-h-56 overflow-auto border-t border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{result.raw}</pre></details>
                                </div>
                            )}
                        </section>
                        <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
                            <div className="flex gap-3"><span className="mt-0.5 text-blue-600 dark:text-blue-300">ⓘ</span><div><h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">Before sending</h3><p className="mt-1 text-xs leading-5 text-blue-800/80 dark:text-blue-300/80">Make sure the transaction ID and credential are correct. The page sends an XML body and relies on your existing authorizedFetch helper for API authorization.</p></div></div>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}
