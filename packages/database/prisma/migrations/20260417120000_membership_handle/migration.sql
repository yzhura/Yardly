-- Optional per-tenant @handle for mentions; unique when set (PostgreSQL allows multiple NULLs).
ALTER TABLE "memberships" ADD COLUMN "handle" TEXT;

CREATE UNIQUE INDEX "memberships_tenant_id_handle_key" ON "memberships" ("tenant_id", "handle");
