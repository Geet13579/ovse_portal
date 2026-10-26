"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PlayStoreQR from "./PlayStoreQR";
import TransactionQR from "./TransactionQR";
import { authorizedFetch, getAdminToken } from "@/app/lib/api-client";

interface User {
    name: string;
    premises_addr: string
}

export default function QRCodePage() {
    const [user, setUser] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const loadProfile = async () => {
            try {
                const token = getAdminToken();
                const response = await authorizedFetch("/api/admin/user-details/", {
                    method: "GET",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to fetch user details.");
                const result = await response.json();
                const profile = result?.data?.user ?? result?.data;
                if (!cancelled) setUser(profile ?? "");
            } catch (error) {
                console.error("Could not load user", error);
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadProfile();
        return () => { cancelled = true; };
    }, []);

    return (
        <main className="relative isolate min-h-dvh overflow-hidden bg-[#f2f6ff] px-3 py-3 pb-40 text-slate-900 sm:px-5 sm:py-5 lg:px-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-40 top-44 h-[34rem] w-[34rem] rounded-full bg-blue-200/50 blur-3xl" />
                <div className="absolute -right-40 top-64 h-[36rem] w-[36rem] rounded-full bg-violet-200/60 blur-3xl" />
                <div className="absolute -bottom-52 left-1/4 h-[32rem] w-[32rem] rounded-full bg-sky-200/50 blur-3xl" />
                <div className="absolute left-8 top-60 h-24 w-24 opacity-50 [background-image:radial-gradient(#60a5fa_2px,transparent_2px)] [background-size:21px_21px]" />
                <div className="absolute right-8 top-[55%] h-24 w-24 opacity-50 [background-image:radial-gradient(#818cf8_2px,transparent_2px)] [background-size:21px_21px]" />
            </div>

            <div className="mx-auto w-full max-w-[1520px]">
                <header className="mb-4 overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_12px_32px_rgba(54,91,180,0.12)] backdrop-blur">
                    <div className="flex min-h-[68px] flex-col items-center gap-2 px-3 py-2 sm:min-h-[68px] sm:flex-row sm:gap-3 sm:px-5 sm:py-1.5">

                        {/* Government Logo */}
                        <Image
                            src="/government-logo.png"
                            alt="Government of Chhattisgarh emblem"
                            width={80}
                            height={80}
                            priority
                            className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
                        />

                        {/* Divider */}
                        <div className="hidden h-11 w-px shrink-0 bg-slate-200 sm:block" />

                        {/* CHiPS Logo */}
                        <Image
                            src="/chips-logo.png"
                            alt="CHiPS logo"
                            width={100}
                            height={70}
                            priority
                            className="h-8 w-16 shrink-0 object-contain sm:h-9 sm:w-20"
                        />

                        {/* Organization Name */}
                        <div className="min-w-0 flex-1 text-center sm:pl-2 sm:text-left">
                            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-900 sm:text-xs">
                                Government of Chhattisgarh
                            </p>

                            <p className="mt-0.5 text-xs font-extrabold leading-tight text-emerald-800 sm:text-base">
                                Chhattisgarh Infotech Promotional Society
                            </p>


                        </div>

                        {/* Dashboard Button */}
                        <Link
                            href="/user/intent-request-list"
                            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-sm"
                        >
                            <span aria-hidden="true" className="text-base">
                                ←
                            </span>
                            Back to Visitor Details
                        </Link>
                    </div>

                    {/* Bottom Gradient */}
                    <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-600 to-violet-600" />
                </header>

                {/* Existing QR Card */}
                <section className="mx-auto flex min-h-[calc(100dvh-150px)] items-center justify-center pb-4">
                    <div className="w-full max-w-[745px] overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_20px_55px_rgba(60,91,180,0.18)]">

                        {/* SDC BUILDING Header */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-blue-600 to-sky-500 px-5 py-3.5 text-white sm:px-8 sm:py-4">


                            <div className="relative flex items-center justify-center gap-4 sm:gap-6">


                                <div className="text-center">
                                    <h1 className="text-lg font-black tracking-wide sm:text-3xl">
                                        Welcome to - {user?.name || "State Data Center"}
                                        {/* WELCOME TO - {"CBD CHiPS"} */}

                                    </h1>

                                    <div className="mt-1 flex items-center justify-center gap-3 text-xs font-medium sm:text-base">
                                        <span className="h-px w-8 bg-white/50" />
                                        {/* C-Block, CBD Building, Naya Raipur */}
                                        {/* Civil Lines, Raipur, CG */}
                                        {user?.premises_addr}
                                        <span className="h-px w-8 bg-white/50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="-mt-3 rounded-t-[30px] bg-white px-3 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
                            <TransactionQR premises_name={user?.name} />
                        </div>
                    </div>
                </section>
            </div>
            <PlayStoreQR />
        </main>
    );
}
