
"use client";

import {
    forwardRef,
    type InputHTMLAttributes,
} from "react";
import { themes, type ThemeName } from "./theme";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    theme?: ThemeName;
    error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    function Input(
        {
            theme = "admin",
            error,
            className = "",
            "aria-describedby": ariaDescribedBy,
            ...props
        },
        ref
    ) {
        //@ts-expect-error null
        const t = themes[theme];
        const errorId = props.id ? `${props.id}-error` : undefined;

        return (
            <div className="w-full">
                <input
                    {...props}
                    ref={ref}
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                        [ariaDescribedBy, error ? errorId : undefined]
                            .filter(Boolean)
                            .join(" ") || undefined
                    }
                    className={`w-full rounded-xl border bg-white px-4 py-3
            text-slate-800 outline-none transition
            placeholder:text-slate-400
            focus:ring-4
            disabled:cursor-not-allowed disabled:bg-slate-100
            ${error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                            : `border-slate-200 ${t.focusBorder} ${t.focusRing}`
                        }
            ${className}`}
                />

                {error && (
                    <p
                        id={errorId}
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

export default Input;
