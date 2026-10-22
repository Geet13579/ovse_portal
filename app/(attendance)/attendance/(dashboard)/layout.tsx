import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

/** Shared dashboard chrome is mounted once for every authenticated dashboard route. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Sidebar>{children}</Sidebar>;
}
