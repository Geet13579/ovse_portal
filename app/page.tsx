
// // "use client";

// // import Link from "next/link";
// // import { useState } from "react";

// // const portals = [
// //     {
// //         title: "Admin Portal",
// //         description:
// //             "Manage users, oversee operations and keep everything organized from one place.",
// //         href: "/admin/login",
// //         label: "Administrator access",
// //         color: "blue",
// //         icon: "shield",
// //     },
// //     {
// //         title: "Attendance Portal",
// //         description:
// //             "Access attendance records and manage daily attendance activities with ease.",
// //         href: "/attendance/login",
// //         label: "Attendance management",
// //         color: "orange",
// //         icon: "calendar",
// //     },
// //     {
// //         title: "User Portal",
// //         description:
// //             "Access your workspace and view your information through a simple interface.",
// //         href: "/user/login",
// //         label: "Personal workspace",
// //         color: "teal",
// //         icon: "users",
// //     },
// // ];

// // function PortalIcon({
// //     type,
// //     className = "",
// // }: {
// //     type: string;
// //     className?: string;
// // }) {
// //     const common = {
// //         className,
// //         fill: "none",
// //         stroke: "currentColor",
// //         strokeWidth: 1.7,
// //         strokeLinecap: "round" as const,
// //         strokeLinejoin: "round" as const,
// //         viewBox: "0 0 24 24",
// //         "aria-hidden": true as const,
// //     };

// //     if (type === "shield") {
// //         return (
// //             <svg {...common}>
// //                 <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
// //                 <path d="m9 12 2 2 4-4" />
// //             </svg>
// //         );
// //     }

// //     if (type === "calendar") {
// //         return (
// //             <svg {...common}>
// //                 <rect x="3" y="5" width="18" height="16" rx="2" />
// //                 <path d="M16 3v4M8 3v4M3 10h18" />
// //                 <path d="m9 15 2 2 4-4" />
// //             </svg>
// //         );
// //     }

// //     if (type === "users") {
// //         return (
// //             <svg {...common}>
// //                 <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
// //                 <circle cx="10" cy="7" r="4" />
// //                 <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
// //             </svg>
// //         );
// //     }

// //     return (
// //         <svg {...common}>
// //             <path d="M5 12h14M13 6l6 6-6 6" />
// //         </svg>
// //     );
// // }

// // export default function HomePage() {
// //     const [menuOpen, setMenuOpen] = useState(false);

// //     return (
// //         <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
// //             {/* Navbar */}
// //             <header className="relative z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
// //                 <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
// //                     <Link href="/" className="flex items-center gap-3">
// //                         <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
// //                             <span className="text-xl font-black">O</span>
// //                         </div>
// //                         <div>
// //                             <p className="text-xl font-extrabold tracking-tight">
// //                                 OVSE<span className="text-blue-600">.</span>
// //                             </p>
// //                             <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
// //                                 Management Portal
// //                             </p>
// //                         </div>
// //                     </Link>

// //                     <nav className="hidden items-center gap-8 md:flex">
// //                         <a
// //                             href="#home"
// //                             className="text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-300"
// //                         >
// //                             Home
// //                         </a>
// //                         <a
// //                             href="#portals"
// //                             className="text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-300"
// //                         >
// //                             Portals
// //                         </a>
// //                         <a
// //                             href="#features"
// //                             className="text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-300"
// //                         >
// //                             Features
// //                         </a>
// //                     </nav>

// //                     <div className="hidden md:block">
// //                         <a
// //                             href="#portals"
// //                             className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
// //                         >
// //                             Access Portal
// //                             <PortalIcon type="arrow" className="h-4 w-4" />
// //                         </a>
// //                     </div>

// //                     <button
// //                         type="button"
// //                         aria-label="Toggle navigation menu"
// //                         aria-expanded={menuOpen}
// //                         onClick={() => setMenuOpen(!menuOpen)}
// //                         className="rounded-xl border border-slate-200 p-2.5 text-slate-700 md:hidden dark:border-slate-700 dark:text-white"
// //                     >
// //                         {menuOpen ? (
// //                             <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //                                 <path d="m18 6-12 12M6 6l12 12" />
// //                             </svg>
// //                         ) : (
// //                             <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //                                 <path d="M4 7h16M4 12h16M4 17h16" />
// //                             </svg>
// //                         )}
// //                     </button>
// //                 </div>

// //                 {menuOpen && (
// //                     <nav className="border-t border-slate-200 px-5 py-4 md:hidden dark:border-slate-800">
// //                         <div className="mx-auto flex max-w-7xl flex-col gap-1">
// //                             {[
// //                                 ["Home", "#home"],
// //                                 ["Portals", "#portals"],
// //                                 ["Features", "#features"],
// //                             ].map(([label, href]) => (
// //                                 <a
// //                                     key={label}
// //                                     href={href}
// //                                     onClick={() => setMenuOpen(false)}
// //                                     className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900"
// //                                 >
// //                                     {label}
// //                                 </a>
// //                             ))}
// //                         </div>
// //                     </nav>
// //                 )}
// //             </header>

// //             {/* Hero */}
// //             <section id="home" className="relative">
// //                 <div className="pointer-events-none absolute inset-0 overflow-hidden">
// //                     <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-400/15 blur-3xl" />
// //                     <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
// //                     <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />
// //                 </div>

// //                 <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-28">
// //                     <div>
// //                         <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-sm dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300">
// //                             <span className="relative flex h-2 w-2">
// //                                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
// //                                 <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
// //                             </span>
// //                             Your workspace, simplified
// //                         </div>

// //                         <h1 className="max-w-2xl text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
// //                             Everything you need.
// //                             <span className="mt-2 block bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
// //                                 One smart portal.
// //                             </span>
// //                         </h1>

// //                         <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-400">
// //                             Welcome to OVSE — your central place to manage operations,
// //                             access attendance and stay connected with your workspace.
// //                             Simple, organized and designed for you.
// //                         </p>

// //                         <div className="mt-9 flex flex-col gap-3 sm:flex-row">
// //                             <a
// //                                 href="#portals"
// //                                 className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700"
// //                             >
// //                                 Explore Portals
// //                                 <PortalIcon type="arrow" className="h-5 w-5" />
// //                             </a>

// //                             <a
// //                                 href="#features"
// //                                 className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
// //                             >
// //                                 Discover Features
// //                             </a>
// //                         </div>

// //                         <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
// //                             <span className="flex items-center gap-2">
// //                                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
// //                                     ✓
// //                                 </span>
// //                                 Role-based access
// //                             </span>
// //                             <span className="flex items-center gap-2">
// //                                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
// //                                     ✓
// //                                 </span>
// //                                 Simple navigation
// //                             </span>
// //                         </div>
// //                     </div>

// //                     {/* Right-side visual */}
// //                     <div className="relative mx-auto w-full max-w-lg">
// //                         <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-teal-400/10 to-orange-400/20 blur-2xl" />

// //                         <div className="relative rounded-[2rem] border border-white bg-white/90 p-5 shadow-2xl shadow-slate-300/40 backdrop-blur-xl sm:p-7 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20">
// //                             <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
// //                                 <div>
// //                                     <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
// //                                         Workspace overview
// //                                     </p>
// //                                     <h2 className="mt-1 text-xl font-bold">Welcome to OVSE</h2>
// //                                 </div>
// //                                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
// //                                     <PortalIcon type="shield" className="h-6 w-6" />
// //                                 </div>
// //                             </div>

// //                             <div className="mt-5 space-y-3">
// //                                 {portals.map((portal) => {
// //                                     const styles = {
// //                                         blue: {
// //                                             icon: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
// //                                             line: "bg-blue-600",
// //                                         },
// //                                         orange: {
// //                                             icon: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
// //                                             line: "bg-[#F47A20]",
// //                                         },
// //                                         teal: {
// //                                             icon: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
// //                                             line: "bg-teal-600",
// //                                         },
// //                                     }[portal.color];

// //                                     return (
// //                                         <Link
// //                                             href={portal.href}
// //                                             key={portal.title}
// //                                             className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
// //                                         >
// //                                             <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
// //                                                 <PortalIcon type={portal.icon} className="h-6 w-6" />
// //                                             </div>
// //                                             <div className="min-w-0 flex-1">
// //                                                 <p className="font-bold">{portal.title}</p>
// //                                                 <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
// //                                                     {portal.label}
// //                                                 </p>
// //                                             </div>
// //                                             <PortalIcon
// //                                                 type="arrow"
// //                                                 className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
// //                                             />
// //                                         </Link>
// //                                     );
// //                                 })}
// //                             </div>

// //                             <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
// //                                 <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
// //                                     <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //                                         <rect x="5" y="10" width="14" height="11" rx="2" />
// //                                         <path d="M8 10V7a4 4 0 1 1 8 0v3" />
// //                                     </svg>
// //                                 </div>
// //                                 <div>
// //                                     <p className="text-sm font-bold">Your access, your workspace</p>
// //                                     <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
// //                                         Choose the portal that fits your role.
// //                                     </p>
// //                                 </div>
// //                             </div>
// //                         </div>

// //                         <div className="absolute -right-3 top-10 hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:block dark:border-slate-800 dark:bg-slate-900">
// //                             <div className="flex items-center gap-2">
// //                                 <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
// //                                     ✓
// //                                 </span>
// //                                 <div>
// //                                     <p className="text-xs font-bold">Easy access</p>
// //                                     <p className="text-[10px] text-slate-500">All in one place</p>
// //                                 </div>
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </section>

// //             {/* Portal cards */}
// //             <section id="portals" className="scroll-mt-20 border-y border-slate-200/70 bg-white py-20 sm:py-24 dark:border-slate-800 dark:bg-slate-900/40">
// //                 <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
// //                     <div className="mx-auto mb-12 max-w-2xl text-center">
// //                         <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600">
// //                             Choose your workspace
// //                         </p>
// //                         <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
// //                             One platform. Three portals.
// //                         </h2>
// //                         <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
// //                             Select your role below to continue to the right workspace.
// //                         </p>
// //                     </div>

// //                     <div className="grid gap-6 md:grid-cols-3">
// //                         {portals.map((portal) => {
// //                             const cardStyles = {
// //                                 blue: {
// //                                     icon: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
// //                                     accent: "bg-blue-600",
// //                                     button: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
// //                                     eyebrow: "text-blue-700 dark:text-blue-300",
// //                                 },
// //                                 orange: {
// //                                     icon: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
// //                                     accent: "bg-[#F47A20]",
// //                                     button: "bg-[#F47A20] hover:bg-orange-600 shadow-orange-500/20",
// //                                     eyebrow: "text-orange-700 dark:text-orange-300",
// //                                 },
// //                                 teal: {
// //                                     icon: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
// //                                     accent: "bg-teal-600",
// //                                     button: "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20",
// //                                     eyebrow: "text-teal-700 dark:text-teal-300",
// //                                 },
// //                             }[portal.color];

// //                             return (
// //                                 <article
// //                                     key={portal.title}
// //                                     className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20"
// //                                 >

// //                                     <div className={`absolute inset-x-0 top-0 h-1 ${cardStyles.accent}`} />

// //                                     <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cardStyles.icon}`}>
// //                                         <PortalIcon type={portal.icon} className="h-7 w-7" />
// //                                     </div>

// //                                     <p className={`mt-6 text-xs font-extrabold uppercase tracking-[0.15em] ${cardStyles.eyebrow}`}>
// //                                         {portal.label}
// //                                     </p>
// //                                     <h3 className="mt-2 text-2xl font-extrabold tracking-tight">
// //                                         {portal.title}
// //                                     </h3>
// //                                     <p className="mt-3 min-h-[84px] text-sm leading-7 text-slate-600 dark:text-slate-400">
// //                                         {portal.description}
// //                                     </p>

// //                                     <Link
// //                                         href={portal.href}
// //                                         className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition ${cardStyles.button}`}
// //                                     >
// //                                         Enter Portal
// //                                         <PortalIcon type="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
// //                                     </Link>
// //                                 </article>
// //                             );
// //                         })}
// //                     </div>
// //                 </div>
// //             </section>

// //             {/* Features */}
// //             <section id="features" className="scroll-mt-20 py-20 sm:py-24">
// //                 <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
// //                     <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
// //                         <div>
// //                             <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600">
// //                                 Designed for simplicity
// //                             </p>
// //                             <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
// //                                 Less complexity.
// //                                 <span className="block text-slate-500 dark:text-slate-400">
// //                                     More productivity.
// //                                 </span>
// //                             </h2>
// //                             <p className="mt-5 max-w-xl leading-8 text-slate-600 dark:text-slate-400">
// //                                 OVSE brings essential workspace access together in one
// //                                 organized experience, so you can focus on what matters.
// //                             </p>

// //                             <Link
// //                                 href="#portals"
// //                                 className="mt-7 inline-flex items-center gap-2 font-bold text-blue-600 transition hover:gap-3 dark:text-blue-400"
// //                             >
// //                                 Find your portal
// //                                 <PortalIcon type="arrow" className="h-5 w-5" />
// //                             </Link>
// //                         </div>

// //                         <div className="grid gap-4 sm:grid-cols-2">
// //                             {[
// //                                 {
// //                                     icon: "shield",
// //                                     title: "Role-based workspaces",
// //                                     text: "Dedicated entry points for different portal roles.",
// //                                     color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
// //                                 },
// //                                 {
// //                                     icon: "calendar",
// //                                     title: "Organized access",
// //                                     text: "Keep everyday portal activities easy to navigate.",
// //                                     color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
// //                                 },
// //                                 {
// //                                     icon: "users",
// //                                     title: "Simple experience",
// //                                     text: "Clear navigation that helps users find their portal.",
// //                                     color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
// //                                 },
// //                                 {
// //                                     icon: "arrow",
// //                                     title: "Responsive design",
// //                                     text: "A layout built to adapt to desktop, tablet and mobile.",
// //                                     color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
// //                                 },
// //                             ].map((feature) => (
// //                                 <div
// //                                     key={feature.title}
// //                                     className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
// //                                 >
// //                                     <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
// //                                         <PortalIcon type={feature.icon} className="h-5 w-5" />
// //                                     </div>
// //                                     <h3 className="mt-4 font-bold">{feature.title}</h3>
// //                                     <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
// //                                         {feature.text}
// //                                     </p>
// //                                 </div>
// //                             ))}
// //                         </div>
// //                     </div>
// //                 </div>
// //             </section>

// //             {/* CTA */}
// //             <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
// //                 <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
// //                     <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[40px] border-white/10" />
// //                     <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full border-[50px] border-white/10" />

// //                     <div className="relative">
// //                         <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
// //                             Get started
// //                         </p>
// //                         <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
// //                             Your workspace is just one click away.
// //                         </h2>
// //                         <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
// //                             Choose your portal and continue to your OVSE workspace.
// //                         </p>
// //                         <a
// //                             href="#portals"
// //                             className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-extrabold text-blue-700 shadow-xl transition hover:-translate-y-1 hover:bg-blue-50"
// //                         >
// //                             Get Started
// //                             <PortalIcon type="arrow" className="h-5 w-5" />
// //                         </a>
// //                     </div>
// //                 </div>
// //             </section>

// //             {/* Footer */}
// //             <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
// //                 <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
// //                     <Link href="/" className="flex items-center gap-2">
// //                         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
// //                             O
// //                         </div>
// //                         <span className="font-extrabold tracking-tight">
// //                             OVSE<span className="text-blue-600">.</span>
// //                         </span>
// //                     </Link>

// //                     <p className="text-sm text-slate-500 dark:text-slate-400">
// //                         A simpler way to access your workspace.
// //                     </p>

// //                     <p className="text-xs text-slate-400">
// //                         © {new Date().getFullYear()} OVSE. All rights reserved.
// //                     </p>
// //                 </div>
// //             </footer>
// //         </main>
// //     );
// // }



// "use client";

// import { useState, type FormEvent } from "react";
// import { useRouter } from "next/navigation";
// import Input from "@/components/ui/Input";
// import PasswordInput from "@/components/ui/PasswordInput";
// import Button from "@/components/ui/Button";
// import FormField from "@/components/ui/FormField";
// import LoginCard from "@/components/ui/LoginCard";
// import { saveAdminToken } from "@/app/lib/api-client";

// type LoginResponse = {
//     token?: string;
//     accessToken?: string;
//     access_token?: string;
//     data?: {
//         token?: string;
//         accessToken?: string;
//         access_token?: string;
//     };
//     error?: string;
//     message?: string;
// };

// export default function AdminLogin() {
//     const router = useRouter();
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     async function handleLogin(e: FormEvent<HTMLFormElement>) {
//         e.preventDefault();
//         setError("");
//         setLoading(true);

//         const formData = new FormData(e.currentTarget);
//         const email = String(formData.get("email") ?? "").trim();
//         const password = String(formData.get("password") ?? "");

//         try {
//             const apiUrl = process.env.NEXT_PUBLIC_API_URL;

//             if (!apiUrl) {
//                 throw new Error("API URL is not configured.");
//             }

//             const response = await fetch(
//                 `${apiUrl}/api/admin/auth/login`,
//                 {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify({ email, password }),
//                 }
//             );

//             const data: LoginResponse = await response.json();

//             if (!response.ok) {
//                 setError(
//                     data.error || data.message || "Invalid ID or password."
//                 );
//                 return;
//             }

//             const token =
//                 data.token ??
//                 data.accessToken ??
//                 data.access_token ??
//                 data.data?.token ??
//                 data.data?.accessToken ??
//                 data.data?.access_token;

//             if (typeof token !== "string" || !token.trim()) {
//                 setError(
//                     "Login response mein token nahi mila. API response check karo."
//                 );
//                 return;
//             }

//             saveAdminToken(token);
//             router.replace("/ovse");
//         } catch (err) {
//             setError(
//                 err instanceof Error ? err.message : "Something went wrong."
//             );
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <LoginCard
//             theme="ovse"
//             icon="🛡️"
//             eyebrow="Secure Portal"
//             title="Ovse Admin Login"
//             subtitle="Manage your application from one place"
//         >
//             <form onSubmit={handleLogin} className="space-y-5">
//                 <FormField label="Email" htmlFor="admin-email" required>
//                     <Input
//                         theme="ovse"
//                         id="admin-email"
//                         name="email"
//                         type="email"
//                         placeholder="admin@example.com"
//                         autoComplete="username"
//                         required
//                     />
//                 </FormField>

//                 <FormField label="Password" htmlFor="admin-password" required>
//                     <PasswordInput
//                         theme="ovse"
//                         id="admin-password"
//                         name="password"
//                         placeholder="Enter admin password"
//                         autoComplete="current-password"
//                         required
//                     />
//                 </FormField>

//                 {error && (
//                     <p role="alert" className="text-sm text-red-600">
//                         {error}
//                     </p>
//                 )}

//                 <Button
//                     theme="ovse"
//                     type="submit"
//                     fullWidth
//                     loading={loading}
//                 >
//                     Secure Sign In →
//                 </Button>
//             </form>
//         </LoginCard>
//     );
// }


"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import LoginCard from "@/components/ui/LoginCard";
import { saveAdminToken } from "@/app/lib/api-client";

type LoginResponse = {
    token?: string;
    accessToken?: string;
    access_token?: string;
    data?: {
        token?: string;
        accessToken?: string;
        access_token?: string;
        role?: string;
    };
    error?: string;
    message?: string;
    status?: boolean;
};

export default function UserLogin() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;

        setError("");
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            // Same login endpoint and request payload as Admin Login.
            const response = await fetch(`${apiUrl}/api/admin/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data: LoginResponse = await response.json().catch(() => ({}));

            if (!response.ok || data.status === false) {
                setError(data.error || data.message || "Invalid ID or password.");
                return;
            }

            const token =
                data.token ??
                data.accessToken ??
                data.access_token ??
                data.data?.token ??
                data.data?.accessToken ??
                data.data?.access_token;

            if (typeof token !== "string" || !token.trim()) {
                setError("Login response mein token nahi mila. API response check karo.");
                return;
            }

            saveAdminToken(token);

            if (data?.data?.role === "SUPER_ADMIN") {
                window.location.href = "/ovse";

            }
            else {
                window.location.href = "/user/intent-request";

            }


        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <LoginCard
            theme="user"
            icon="👤"
            eyebrow="OVSE Portal"
            title="Welcome Back!"
            subtitle="Sign in to continue your premises Admin account"
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <FormField label="Username" htmlFor="user-email" required>
                    <Input
                        theme="user"
                        id="user-email"
                        name="email"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter Username"
                        required
                    />
                </FormField>

                <FormField label="Password" htmlFor="user-password" required>
                    <PasswordInput
                        theme="user"
                        id="user-password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter password"
                        required
                    />
                </FormField>

                {error && (
                    <p className="text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}

                <Button theme="user" type="submit" fullWidth loading={loading}>
                    {loading ? "Signing in…" : "Secure Sign In →"}
                </Button>
            </form>
        </LoginCard>
    );
}




