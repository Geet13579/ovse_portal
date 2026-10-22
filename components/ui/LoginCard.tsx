
import type { ReactNode } from "react";
import { themes, type ThemeName } from "./theme";

type LoginCardProps = {
    theme?: ThemeName;
    icon: ReactNode;
    title: string;
    subtitle: string;
    eyebrow?: string;
    children: ReactNode;
};

export default function LoginCard({
    //@ts-expect-error null
    theme = "admin",
    icon,
    title,
    subtitle,
    eyebrow,
    children,
}: LoginCardProps) {
    const t = themes[theme];

    return (
        <main
            className={`flex min-h-screen items-center justify-center p-5 ${t.page}`}
        >
            <section className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-xl sm:p-10">
                <header className="mb-8 text-center">
                    <div
                        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${t.iconBg}`}
                    >
                        {icon}
                    </div>

                    {eyebrow && (
                        <p
                            className={`mb-2 text-xs font-bold uppercase tracking-[0.25em] ${t.eyebrow}`}
                        >
                            {eyebrow}
                        </p>
                    )}

                    <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                        {title}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                </header>

                {children}
            </section>
        </main>
    );
}
