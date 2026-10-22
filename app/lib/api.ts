
"use client";

export async function apiFetch(
    url: string,
    options: RequestInit = {}
) {
    const token = sessionStorage.getItem("access_token");
    const headers = new Headers(options.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
        cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        sessionStorage.removeItem("access_token");
        window.location.href = "/attendance-admin-login";
        throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
    }

    return data;
}
