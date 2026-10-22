
"use client";

import type { InputHTMLAttributes } from "react";
import { themes, type ThemeName } from "./theme";

type CheckboxProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
> & {
    label: string;
    theme?: ThemeName;
};

export default function Checkbox({
    label,
    //@ts-expect-error null
    theme = "admin",
    className = "",
    id,
    ...props
}: CheckboxProps) {
    const generatedId = id ?? props.name;
    const t = themes[theme];

    return (
        <label
            htmlFor={generatedId}
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600"
        >
            <input
                {...props}
                id={generatedId}
                type="checkbox"
                className={`h-4 w-4 rounded ${t.accent} ${className}`}
            />
            <span>{label}</span>
        </label>
    );
}
