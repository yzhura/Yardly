# Yardly — agent and contributor context

## Where the rules live

- **Cursor (primary):** [`.cursor/rules/yardly-core.mdc`](.cursor/rules/yardly-core.mdc) — `alwaysApply: true`; stack, tenancy, security, admin patterns (incl. Nest proxy + **`handleApiProxyError`** / **`ERROR_MESSAGE_MAP`**, membership `@handle` constants, optional **`X-Tenant-Id`** on profile, modal/`Select` z-index, hidden file input + button, `*-page-skeleton` + route `loading.tsx`, materials unit DTO helper), tooling, and code-style expectations.
- **Nest API security (globs):** [`.cursor/rules/yardly-api-security.mdc`](.cursor/rules/yardly-api-security.mdc) — applies when working under `apps/api/**`.
- **Admin UX (globs):** [`.cursor/rules/yardly-ux.mdc`](.cursor/rules/yardly-ux.mdc) — applies when working under `apps/admin/**`; clarity, discoverability, Apple/Google-like polish, empty states, feedback, a11y — complements motion/Shadcn rules in `yardly-core.mdc`.
- **Legacy pointer:** [`.cursorrules`](.cursorrules) — redirects to the paths above.

Read `yardly-core.mdc` before substantial changes to `apps/admin`, `apps/api`, or `packages/database`.

## Non-negotiables (summary)

- **UI copy:** Ukrainian. **Code identifiers, comments, internal docs:** English.
- **Multi-tenancy:** Domain data is scoped by `tenantId`; no `tenantId` on `User`.
- **Schema changes:** Prisma migrations (`npm run db:migrate`), not ad-hoc `db:push` in normal dev.
- **Admin ↔ API:** Browser uses the shared Axios client and TanStack Query hooks; no secrets (e.g. `service_role`) in the admin bundle.
- **Admin `components/`:** Use domain folders (`team/`, `settings/`, `auth/`, `organization/`, `common/`, `layout/`, `ui/`, `skeletons/` for shared blocks only) — see **Tech Stack** in `yardly-core.mdc`.
- **Shadcn Form:** `FormLabel` / `FormControl` / `FormMessage` only under `<FormField>`; read-only display fields → `Label` + `Input` (see `yardly-core.mdc` Forms).

For the full list, see `yardly-core.mdc`.
