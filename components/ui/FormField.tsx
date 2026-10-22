
import type { ReactNode } from "react";

type FormFieldProps = {
    label: string;
    htmlFor: string;
    children: ReactNode;
    required?: boolean;
    hint?: string;
};

export default function FormField({
    label,
    htmlFor,
    children,
    required = false,
    hint,
}: FormFieldProps) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={htmlFor}
                className="block text-sm font-semibold text-slate-700"
            >
                {label}
                {required && (
                    <span className="ml-1 text-red-500" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            {children}

            {hint && (
                <p className="text-xs text-slate-500">{hint}</p>
            )}
        </div>
    );
}
