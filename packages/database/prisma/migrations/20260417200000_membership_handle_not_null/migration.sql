-- Backfill missing handles (stable per row), then require handle for every membership.
UPDATE "memberships"
SET "handle" = lower(left(replace("id"::text, '-', ''), 32))
WHERE "handle" IS NULL;

ALTER TABLE "memberships" ALTER COLUMN "handle" SET NOT NULL;
