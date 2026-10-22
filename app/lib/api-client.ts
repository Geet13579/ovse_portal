
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getAdminToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
}

export function saveAdminToken(token: string): void {
    localStorage.setItem("admin_token", token);
}

export function clearAdminToken(): void {
    localStorage.removeItem("admin_token");
}

export async function authorizedFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    if (typeof window === "undefined") {
        throw new Error("API request must run in the browser.");
    }

    const token = getAdminToken();

    if (!token) {
        throw new Error("Authorization token missing. Please login again.");
    }

    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });
}
