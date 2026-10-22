export const themes = {
  ovse: {
    page: "bg-gradient-to-br from-blue-50 via-white to-indigo-100",
    iconBg: "bg-blue-100", eyebrow: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700", text: "text-blue-700",
    focusBorder: "focus:border-blue-500", focusRing: "focus:ring-blue-100",
    groupFocus: "focus-within:border-blue-500 focus-within:ring-blue-100",
    accent: "accent-blue-600",
    sidebarActive: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    sidebarIcon: "text-blue-600", logo: "bg-blue-600",
  },
  attendance: {
    page: "bg-gradient-to-br from-orange-50 via-white to-amber-100",
    iconBg: "bg-orange-100", eyebrow: "text-orange-700",
    button: "bg-[#F47A20] hover:bg-[#D85F0B]", text: "text-[#D85F0B]",
    focusBorder: "focus:border-[#F47A20]", focusRing: "focus:ring-orange-100",
    groupFocus: "focus-within:border-[#F47A20] focus-within:ring-orange-100",
    accent: "accent-orange-600",
    sidebarActive: "bg-orange-50 text-[#D85F0B] dark:bg-orange-500/10 dark:text-orange-300",
    sidebarIcon: "text-[#F47A20]", logo: "bg-[#F47A20]",
  },
  user: {
    page: "bg-gradient-to-br from-teal-50 via-white to-cyan-100",
    iconBg: "bg-teal-100", eyebrow: "text-teal-700",
    button: "bg-teal-600 hover:bg-teal-700", text: "text-teal-700",
    focusBorder: "focus:border-teal-500", focusRing: "focus:ring-teal-100",
    groupFocus: "focus-within:border-teal-500 focus-within:ring-teal-100",
    accent: "accent-teal-600",
    sidebarActive: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
    sidebarIcon: "text-teal-600", logo: "bg-teal-600",
  },
} as const;
export type ThemeName = keyof typeof themes;
