// Mock data shared by pages. Replace with API calls when your backend is ready.

export type Status = "Active" | "Pending" | "Suspended";
export type Role = "Admin" | "Editor" | "Viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  joined: string; // ISO date, e.g. 2026-03-14
  spend: number;
}

export const ROLES: Role[] = ["Admin", "Editor", "Viewer"];
export const STATUS_LIST: Status[] = ["Active", "Pending", "Suspended"];

const FIRST = ["Aarav", "Diya", "Rohan", "Ananya", "Kabir", "Meera", "Ishaan", "Riya", "Vihaan", "Sneha", "Arjun", "Pooja"];
const LAST = ["Sharma", "Patel", "Verma", "Gupta", "Singh", "Nair", "Joshi", "Reddy", "Mehta", "Kulkarni"];
const STATUS_MIX: Status[] = ["Active", "Active", "Active", "Pending", "Suspended"];

export const USERS: User[] = Array.from({ length: 48 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 3) % LAST.length];
  const month = ((i * 5) % 12) + 1;
  const day = ((i * 7) % 27) + 1;
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
    role: ROLES[i % 3],
    status: STATUS_MIX[(i * 2) % STATUS_MIX.length],
    joined: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    spend: 1200 + ((i * 7919) % 48000),
  };
});
