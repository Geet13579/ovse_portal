
// import { NextRequest, NextResponse } from "next/server";
// import { COOKIE, verifySession } from "@/app/lib/auth";

// const publicRoutes = [
//   "/login",
//   "/user-login",
//   "/ovse-login",
//   "/attendance-admin-login",
// ];

// const roleRoutes: Record<string, string> = {
//   "/admin/dashboard": "admin",
//   "/attendance/dashboard": "attendance",
//   "/user/dashboard": "user",
//   "/ovse/dashboard": "ovse",
// };

// function getRequiredRole(pathname: string) {
//   const match = Object.entries(roleRoutes).find(
//     ([route]) =>
//       pathname === route || pathname.startsWith(`${route}/`)
//   );

//   return match?.[1];
// }

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   if (
//     publicRoutes.includes(pathname) ||
//     pathname === "/"
//   ) {
//     return NextResponse.next();
//   }

//   const user = await verifySession(
//     req.cookies.get(COOKIE)?.value
//   );

//   if (!user) {
//     const url = new URL("/login", req.url);
//     url.searchParams.set("next", pathname);
//     return NextResponse.redirect(url);
//   }

//   const requiredRole = getRequiredRole(pathname);

//   if (requiredRole && user.role !== requiredRole) {
//     const dashboards: Record<string, string> = {
//       admin: "/admin/dashboard",
//       attendance: "/attendance/dashboard",
//       user: "/user/dashboard",
//       ovse: "/ovse/dashboard",
//     };

//     return NextResponse.redirect(
//       new URL(dashboards[user.role], req.url)
//     );
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/((?!api|_next/static|_next/image|favicon.ico).*)",
//   ],
// };



import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

