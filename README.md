# OVSE Portal — Refactored

Next.js App Router + TypeScript + Tailwind CSS admin portal.

## What changed
- Dashboard chrome (sidebar, top bar, theme toggle, logout) is mounted once through `app/(dashboard)/layout.tsx`.
- Dashboard pages no longer wrap themselves in `<Shell>`, so the sidebar is not duplicated per page.
- Reusable UI primitives and design tokens remain centralized in `app/components/ui.tsx`.
- User search now lives with the Users page filter controls, keeping page-specific state local.
- Route group `(dashboard)` does not change public URLs: `/`, `/users`, `/settings`, and `/intent_genration` stay the same.
- Generated folders (`node_modules`, `.next`) are intentionally excluded from this source archive.

## Folder structure
```text
ovse_portal/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Shared dashboard shell mounted once
│   │   ├── page.tsx               # Dashboard route: /
│   │   ├── users/page.tsx         # Users route: /users
│   │   ├── settings/page.tsx      # Settings route: /settings
│   │   └── intent_genration/page.tsx
│   ├── api/
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   ├── components/
│   │   ├── Shell.tsx              # Sidebar + top bar + page frame
│   │   └── ui.tsx                 # Shared icons, badges, fields, buttons, tokens
│   ├── lib/
│   │   ├── auth.ts
│   │   └── data.ts
│   ├── login/page.tsx             # Login remains outside dashboard shell
│   ├── globals.css
│   ├── layout.tsx                # Root document and global styles
│   └── ...
├── middleware.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Run locally
```bash
npm install
cp .env.example .env.local # if provided; otherwise create .env.local manually
# Set AUTH_SECRET to a long random secret in .env.local
npm run dev
```

## Important production notes
- Current dashboard data is mock/in-memory data; wire it to your API/database before production.
- Set a strong `AUTH_SECRET` in the deployment environment. The development fallback is not production-safe.
- Review the login route's credential handling before deploying.
# ovse_portal
