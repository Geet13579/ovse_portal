
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
    };
    error?: string;
    message?: string;
};

export default function AdminLogin() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            const response = await fetch(
                `${apiUrl}/api/admin/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                }
            );

            const data: LoginResponse = await response.json();

            if (!response.ok) {
                setError(
                    data.error || data.message || "Invalid ID or password."
                );
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
                setError(
                    "Login response mein token nahi mila. API response check karo."
                );
                return;
            }

            saveAdminToken(token);
            router.replace("/ovse");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <LoginCard
            theme="ovse"
            icon="🛡️"
            eyebrow="Secure Portal"
            title="Ovse Admin Login"
            subtitle="Manage your application from one place"
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <FormField label="Email" htmlFor="admin-email" required>
                    <Input
                        theme="ovse"
                        id="admin-email"
                        name="email"
                        type="email"
                        placeholder="admin@example.com"
                        autoComplete="username"
                        required
                    />
                </FormField>

                <FormField label="Password" htmlFor="admin-password" required>
                    <PasswordInput
                        theme="ovse"
                        id="admin-password"
                        name="password"
                        placeholder="Enter admin password"
                        autoComplete="current-password"
                        required
                    />
                </FormField>

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <Button
                    theme="ovse"
                    type="submit"
                    fullWidth
                    loading={loading}
                >
                    Secure Sign In →
                </Button>
            </form>
        </LoginCard>
    );
}
