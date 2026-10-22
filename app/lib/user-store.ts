
import { USERS, type User } from "@/app/lib/data";

const STORAGE_KEY = "app-users";

export function getUsers(): User[] {
    if (typeof window === "undefined") return USERS;

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
            const parsed: unknown = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed as User[];
            }
        }
    } catch (error) {
        console.error("Unable to load users:", error);
    }

    return USERS;
}

export function saveUsers(users: User[]): void {
    if (typeof window === "undefined") {
        throw new Error("Browser storage is unavailable.");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}
