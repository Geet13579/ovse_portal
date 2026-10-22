export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    password: string;
}

export type UserForm = Omit<User, "id">;

const STORAGE_KEY = "app-users";

export function getUsers(): User[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored === null) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            return [];
        }

        const parsed: unknown = JSON.parse(stored);

        if (!Array.isArray(parsed)) return [];

        // Purane records mein required fields missing ho sakte hain.
        return parsed.filter(
            (item): item is User =>
                item !== null &&
                typeof item === "object" &&
                typeof item.id === "number" &&
                typeof item.name === "string" &&
                typeof item.email === "string" &&
                typeof item.phone === "string" &&
                typeof item.password === "string"
        );
    } catch {
        return [];
    }
}

export function saveUsers(users: User[]): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}