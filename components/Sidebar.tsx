
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Avatar, Icon, type IconName } from "./ui";
import { themes, type ThemeName } from "./ui/theme";

import { authorizedFetch, getAdminToken } from "@/app/lib/api-client";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
};

type RoleConfig = {
  title: string;
  name: string;
  email: string;
  theme: ThemeName;
  nav: NavItem[];
};

const ROLE_CONFIG = {
  admin: {
    title: "Ovse Portal",
    name: "Ovse User",
    email: "admin@example.com",
    theme: "ovse",
    nav: [
      { label: "Dashboard", href: "/ovse", icon: "home" },
      {
        label: "Visitor Details",
        href: "/ovse/intent-request-list",
        icon: "users",
      },
      { label: "Premises List", href: "/ovse/users", icon: "users" },
      { label: "Settings", href: "/ovse/settings", icon: "cog" },
    ],
  },

  attendance: {
    title: "Attendance Admin",
    name: "Attendance Admin",
    email: "attendance@example.com",
    theme: "attendance",
    nav: [
      { label: "Dashboard", href: "/attendance", icon: "home" },
      {
        label: "Employee",
        href: "/attendance/employees",
        icon: "users",
      },
      {
        label: "Settings",
        href: "/attendance/settings",
        icon: "cog",
      },
    ],
  },

  user: {
    title: "User Portal",
    name: "User",
    email: "user@example.com",
    theme: "user",
    nav: [
      // { label: "Dashboard", href: "/user", icon: "home" },
      {
        label: "QR Page",
        href: "/user/intent-request",
        icon: "users",
      },
      {
        label: "Visitor Details",
        href: "/user/intent-request-list",
        icon: "users",
      },

      // { label: "Settings", href: "/user/settings", icon: "cog" },
    ],
  },
} satisfies Record<string, RoleConfig>;

type ShellProps = {
  children: React.ReactNode;
  role?: keyof typeof ROLE_CONFIG;
};

export default function Sidebar({
  children,
  role = "admin",
}: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  const config = ROLE_CONFIG[role];
  const theme = themes[config.theme];

  // Role badge details
  const roleBadge = {
    admin: {
      label: "SUPER ADMIN",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    },
    attendance: {
      label: "ATTENDANCE ADMIN",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    user: {
      label: "USER PREMISES",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    },
  }[role];

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      let response: Response;

      if (role === "user") {
        const token = getAdminToken();

        response = await authorizedFetch(
          "/api/admin/user-details/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else if (role === "admin") {
        response = await authorizedFetch("/api/admin/user/0", {
          method: "GET",
        });
      } else {
        // Add attendance profile endpoint here when available.
        setProfileName("");
        setProfileEmail("");
        return;
      }

      if (!response.ok) {
        throw new Error(`Profile request failed: ${response.status}`);
      }

      const result = await response.json();
      const profile = result?.data?.user ?? result?.data;

      if (!profile || profile.id === undefined) {
        throw new Error("Unexpected profile API response format.");
      }

      setProfileName(profile.name ?? "");
      setProfileEmail(profile.email ?? "");
    } catch (error) {
      console.error("Could not load sidebar profile:", error);
    }
  }, [role]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function toggleTheme() {
    const next = !dark;

    setDark(next);
    document.documentElement.classList.toggle("dark", next);

    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage may be unavailable.
    }
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.push(
        "/"
        // role === "attendance"
        //   ? "/attendance-admin-login"
        //   : role === "user"
        //     ? "/user-login"
        //     : "/ovse-login"
      );

      router.refresh();
    }
  }

  const iconBtn =
    "rounded-md p-2 text-slate-600 hover:bg-slate-100 " +
    "dark:text-slate-300 dark:hover:bg-slate-800";

  const displayName = profileName || config.name;
  const displayEmail = profileEmail || config.email;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col
          border-r border-slate-200 bg-white transition-transform
          dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 items-center justify-center
                rounded-xl text-sm font-bold text-white ${theme.logo}`}
            >
              {role === "attendance"
                ? "A"
                : role === "user"
                  ? "U"
                  : "A"}
            </span>

            <span className="text-base font-bold text-slate-900 dark:text-white">
              {config.title}
            </span>
          </div>

          <button
            onClick={() => setOpen(false)}
            className={`${iconBtn} lg:hidden`}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">

          {config.nav.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            const className = `flex items-center gap-3 rounded-xl px-3 py-3
    text-sm font-medium transition-colors
    ${active
                ? theme.sidebarActive
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`;

            const content = (
              <>
                <Icon
                  name={item.icon}
                  className={`h-5 w-5 ${active ? theme.sidebarIcon : ""
                    }`}
                />
                {item.label}
              </>
            );

            if (
              role === "user" &&
              item.href === "/user/intent-request"
            ) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={className}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {content}
              </Link>
            );
          })}

        </nav>

        {/* Logged-in profile and role badge */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <Avatar name={displayName} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {displayName}
              </p>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {displayEmail}
              </p>

              {/* Role indicator */}
              <span
                className={`mt-2 inline-flex max-w-full rounded-full
                  px-2.5 py-1 text-[10px] font-bold tracking-wider
                  ${roleBadge.className}`}
              >
                {roleBadge.label}
              </span>
            </div>

            <button
              onClick={logout}
              className={iconBtn}
              aria-label="Log out"
              title="Log out"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header
          className="sticky top-0 z-20 flex h-16 items-center
            gap-3 border-b border-slate-200 bg-white/90 px-4
            backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6"
        >
          <button
            onClick={() => setOpen(true)}
            className={`${iconBtn} lg:hidden`}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>



          <div className="ml-auto">
            <button
              onClick={toggleTheme}
              className={iconBtn}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              <Icon name={dark ? "sun" : "moon"} />
            </button>
          </div>
        </header>

        <main className="space-y-6 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
