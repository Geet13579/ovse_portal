
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
export default function AttendanceAdminLogin() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");



    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;

        setError("");
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const username = String(formData.get("username") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_ATTENDANCE_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            // Same login endpoint and request payload as Admin Login.
            const response = await fetch(`${apiUrl}/api/v2/employee-login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, paas: password }),
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

            window.location.href = "/attendance-admin-login";




        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }



    return (
        <LoginCard
            theme="attendance"
            icon="📅"
            title="Attendance Portal"
            subtitle="Attendance Management Administrator"
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <FormField
                    label="Username"
                    htmlFor="attendance-admin-username"
                    required
                >
                    <Input
                        theme="attendance"
                        id="attendance-admin-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter Username"
                        required
                    />
                </FormField>

                <FormField
                    label="Password"
                    htmlFor="attendance-password"
                    required
                >
                    <PasswordInput
                        theme="attendance"
                        id="attendance-password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        required
                    />
                </FormField>

                {error && (
                    <p
                        className="text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                <Button
                    theme="attendance"
                    type="submit"
                    fullWidth
                    loading={loading}
                >
                    {loading
                        ? "Signing in..."
                        : "Login to Dashboard →"}
                </Button>
            </form>
        </LoginCard>
    );
}
