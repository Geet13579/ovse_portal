
"use client";

import type { ButtonHTMLAttributes } from "react";
import { themes, type ThemeName } from "./theme";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    theme?: ThemeName;
    variant?: "primary" | "secondary" | "danger" | "outline";
    fullWidth?: boolean;
    loading?: boolean;
};

export default function Button({
    children,
    //@ts-expect-error null
    theme = "admin",
    variant = "primary",
    fullWidth = false,
    loading = false,
    disabled,
    className = "",
    type = "button",
    ...props
}: ButtonProps) {
    const t = themes[theme];

    const variants = {
        primary: `${t.button} text-white shadow-lg`,
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        danger: "bg-red-600 text-white hover:bg-red-700",
        outline:
            "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    };

    return (
        <button
            {...props}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading}
            className={`inline-flex items-center justify-center gap-2
        rounded-xl px-5 py-3.5 font-semibold transition duration-200
        focus-visible:outline-none focus-visible:ring-4
        focus-visible:ring-blue-200
        disabled:cursor-not-allowed disabled:opacity-60
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}`}
        >
            {loading ? "Please wait..." : children}
        </button>
    );
}
