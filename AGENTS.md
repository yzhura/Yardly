# Yardly — agent and contributor context

## Where the rules live

- **Cursor (primary):** [`.cursor/rules/yardly-core.mdc`](.cursor/rules/yardly-core.mdc) — `alwaysApply: true`; stack, tenancy, security, admin patterns, tooling, and code-style expectations.
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
