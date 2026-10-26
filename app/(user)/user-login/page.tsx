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
            window.location.href = "/user/intent-request"
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
                <FormField label="Email" htmlFor="user-email" required>
                    <Input
                        theme="user"
                        id="user-email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        placeholder="admin@example.com"
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
