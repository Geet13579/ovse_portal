
"use client";

import { useState, type InputHTMLAttributes } from "react";
import { themes, type ThemeName } from "./theme";

type PasswordInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
> & {
    theme?: ThemeName;
    error?: string;
};

export default function PasswordInput({
    //@ts-expect-error null
    theme = "admin",
    error,
    className = "",
    ...props
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const t = themes[theme];
    const errorId = props.id ? `${props.id}-error` : undefined;

    return (
        <div className="w-full">
            <div
                className={`flex rounded-xl border bg-white transition
          ${t.groupFocus} focus-within:ring-4
          ${error
                        ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-100"
                        : "border-slate-200"
                    }`}
            >
                <input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className={`min-w-0 flex-1 rounded-l-xl bg-transparent
            px-4 py-3 text-slate-800 outline-none
            placeholder:text-slate-400 ${className}`}
                />

                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className={`rounded-r-xl px-4 text-sm font-semibold
            ${t.text} focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-inset`}
                >
                    {showPassword ? "Hide" : "Show"}
                </button>
            </div>

            {error && (
                <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
