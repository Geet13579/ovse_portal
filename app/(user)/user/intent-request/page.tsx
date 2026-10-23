
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import PlayStoreQR from "./PlayStoreQR";
import TransactionQR from "./TransactionQR";
import { authorizedFetch, getAdminToken } from "@/app/lib/api-client";

export default function QRCodePage() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);

                const token = getAdminToken();

                const response = await authorizedFetch(
                    "/api/admin/user-details/",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch user details.");
                }

                const result = await response.json();

                const profile = result?.data?.user ?? result?.data;

                setName(profile?.name ?? "");
            } catch (error) {
                console.error("Could not load user name:", error);
                setName("");
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, []);

    return (
        <main className="relative min-h-dvh overflow-x-hidden bg-[#f4f8fc] px-4 py-5 pb-44 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1520px]">
                {/* Header */}
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">
                            User Portal / Secure Access
                        </p>

                        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                            {loading ? "Loading name..." : name}

                        </h1>

                    </div>

                    <Link
                        href="/user"
                        className="inline-flex min-h-12 w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <span aria-hidden="true">←</span>
                        Back to dashboard
                    </Link>
                </header>

                {/* Centered Transaction QR */}
                <section className="flex min-h-[calc(100dvh-180px)] items-center justify-center pb-6 md:pb-0">
                    <div className="w-full max-w-2xl">
                        <TransactionQR />
                    </div>
                </section>
            </div>

            {/* App download QR cards */}
            <PlayStoreQR />
        </main>
    );
}
