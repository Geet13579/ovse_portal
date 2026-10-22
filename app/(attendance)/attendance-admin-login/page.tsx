
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import LoginCard from "@/components/ui/LoginCard";

export default function AttendanceAdminLogin() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const email = String(formData.get("email") ?? "")
            .trim()
            .toLowerCase();

        const password = String(formData.get("password") ?? "");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ username: email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Login failed");
            }

            sessionStorage.setItem("access_token", data.token);
            window.location.href = "/dashboard";


            if (!response.ok) {
                throw new Error(
                    data.message || data.error || "Invalid email or password."
                );
            }

            // API should set an HttpOnly session cookie.
            router.replace("/attendance/dashboard");
            router.refresh();
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Server se connect nahi ho pa raha hai."
            );
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
                    label="Email ID"
                    htmlFor="attendance-admin-email"
                    required
                >
                    <Input
                        theme="attendance"
                        id="attendance-admin-email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        placeholder="Enter your email ID"
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
