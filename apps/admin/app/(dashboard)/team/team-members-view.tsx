"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  UserCog,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useRemoveMember, useUpdateMemberRole } from "@/api/members/use-member-actions";
import { useMembers } from "@/api/members/use-members";
import { type TenantMemberRole } from "@/api/members/types";
import { toast } from "react-toastify";
import {
  INVITABLE_ROLES,
  ORGANIZATION_ROLE_LABELS,
  organizationRoleLabel,
} from "@/lib/organization-roles";
import { memberDisplayName, memberInitials } from "@/lib/tenant-members";
import { listItemReveal, MOTION_DURATION, MOTION_EASE, surfaceReveal } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

type TeamMembersViewProps = {
  tenantId: string;
  canInvite: boolean;
  currentUserId: string;
  actorRole: string;
};

type PendingAction =
  | {
      type: "role";
      membershipId: string;
      memberName: string;
      nextRole: TenantMemberRole;
      prevRole: TenantMemberRole;
    }
  | {
      type: "delete";
      membershipId: string;
      memberName: string;
    };

function canManageMember({
  canInvite,
  actorRole,
  memberRole,
  isSelf,
}: {
  canInvite: boolean;
  actorRole: string;
  memberRole: TenantMemberRole;
  isSelf: boolean;
}) {
  if (!canInvite || isSelf || memberRole === "OWNER") {
    return false;
  }
  if (actorRole === "ADMIN" && memberRole === "ADMIN") {
    return false;
  }
  return true;
}

export function TeamMembersView({
  tenantId,
  canInvite,
  currentUserId,
  actorRole,
}: TeamMembersViewProps) {
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useMembers(tenantId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const [roleDrafts, setRoleDrafts] = useState<Record<string, TenantMemberRole>>(
    {},
  );
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const members = useMemo(() => data?.members ?? [], [data?.members]);
  useEffect(() => {
    setRoleDrafts(
      Object.fromEntries(
        members.map((m) => [m.id, m.role as TenantMemberRole]),
      ) as Record<string, TenantMemberRole>,
    );
  }, [members]);

  const total = members.length;
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(rawPage, totalPages) : 1;
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = members.slice(start, start + PAGE_SIZE);
  const from = total === 0 ? 0 : start + 1;
  const to = start + pageRows.length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const addedThisMonth = members.filter((m) => new Date(m.createdAt) >= monthStart).length;
  const isConfirmBusy = updateRole.isPending || removeMember.isPending;

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Користувачі</h1>
        <Card className="border-border shadow-sm">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Не вдалося завантажити список команди. Спробуйте оновити сторінку.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-8"
      initial={surfaceReveal.initial}
      animate={surfaceReveal.animate}
      transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Користувачі
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Керуйте вашою командою та призначайте ролі.
          </p>
        </div>
        {canInvite ? (
          <Button className="shrink-0 shadow-sm" asChild>
            <Link href="/team/invite" className="gap-2">
              <UserPlus className="h-4 w-4" aria-hidden />
              Запросити в команду
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div initial={listItemReveal.initial} animate={listItemReveal.animate} transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}>
          <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Усього в команді</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {isLoading ? "—" : total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary">
              {isLoading
                ? "Завантаження..."
                : addedThisMonth > 0
                  ? `+${addedThisMonth} цього місяця`
                  : "Нових цього місяця немає"}
            </p>
          </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={listItemReveal.initial} animate={listItemReveal.animate} transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE, delay: 0.04 }}>
          <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Активні зараз</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums text-muted-foreground">
              —
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
              Статус «у мережі» з’явиться згодом
            </p>
          </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={listItemReveal.initial} animate={listItemReveal.animate} transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE, delay: 0.08 }}>
          <Card className="relative overflow-hidden border-border shadow-sm sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Доступні ролі</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(ORGANIZATION_ROLE_LABELS).map(([key, label]) => (
              <span
                key={key}
                className="inline-flex rounded-full border border-border bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground"
              >
                {label}
              </span>
            ))}
          </CardContent>
          <UserCog className="pointer-events-none absolute -bottom-2 right-3 h-24 w-24 text-muted/25" aria-hidden />
          </Card>
        </motion.div>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Користувач
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Роль
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Дата додавання
                  </th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Завантаження...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Немає учасників для відображення.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const email = row.user.email;
                    const name = memberDisplayName(email);
                    const initials = memberInitials(email);
                    const role = row.role as TenantMemberRole;
                    const roleIsOwner = role === "OWNER";
                    const isSelf = row.user.id === currentUserId;
                    const actorIsAdmin = actorRole === "ADMIN";
                    const selectedRole = roleDrafts[row.id] ?? role;
                    const canManageRow = canManageMember({
                      canInvite,
                      actorRole,
                      memberRole: role,
                      isSelf,
                    });
                    const isRowBusy =
                      updateRole.isPending || removeMember.isPending;
                    return (
                      <motion.tr
                        key={row.id}
                        className="border-b border-border/80 last:border-0 transition-colors duration-200 hover:bg-muted/30"
                        initial={listItemReveal.initial}
                        animate={listItemReveal.animate}
                        transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
                              aria-hidden
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {email ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {canManageRow ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedRole}
                                onChange={(e) => {
                                  const nextRole = e.target.value as TenantMemberRole;
                                  if (nextRole === row.role) {
                                    return;
                                  }
                                  setRoleDrafts((prev) => ({
                                    ...prev,
                                    [row.id]: nextRole,
                                  }));
                                  setPendingAction({
                                    type: "role",
                                    membershipId: row.id,
                                    memberName: name,
                                    nextRole,
                                    prevRole: role,
                                  });
                                }}
                                className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                                disabled={isRowBusy}
                                aria-label={`Роль для ${name}`}
                              >
                                {INVITABLE_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {organizationRoleLabel(role)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                roleIsOwner
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {organizationRoleLabel(row.role)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-2 text-foreground">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                            Активний
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground tabular-nums">
                          {new Date(row.createdAt).toLocaleDateString("uk-UA")}
                        </td>
                        <td className="px-6 py-4">
                          {canManageRow ? (
                            <div className="flex items-center justify-end">
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isRowBusy}
                                onClick={() => {
                                  setPendingAction({
                                    type: "delete",
                                    membershipId: row.id,
                                    memberName: name,
                                  });
                                }}
                              >
                                Видалити
                              </Button>
                            </div>
                          ) : (
                            <p className="text-right text-xs text-muted-foreground">
                              {isSelf
                                ? "Це ви"
                                : roleIsOwner
                                  ? "Власник"
                                  : actorIsAdmin && role === "ADMIN"
                                    ? "Недоступно"
                                    : "—"}
                            </p>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && total > 0 ? (
            <div className="flex flex-col gap-4 border-t border-border px-3 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Показано {from}-{to} з {total} {total === 1 ? "користувача" : "користувачів"}
              </p>
              {totalPages > 1 ? (
                <nav className="flex flex-wrap items-center justify-start gap-1 sm:justify-end" aria-label="Сторінки">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={page <= 1}
                    asChild={page > 1}
                  >
                    {page > 1 ? (
                      <Link href={page === 2 ? "/team" : `/team?page=${page - 1}`} aria-label="Попередня сторінка">
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex">
                        <ChevronLeft className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                  {totalPages <= 12
                    ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="icon"
                          className="h-9 w-9"
                          asChild
                        >
                          <Link href={p === 1 ? "/team" : `/team?page=${p}`} aria-current={p === page ? "page" : undefined}>
                            {p}
                          </Link>
                        </Button>
                      ))
                    : null}
                  {totalPages > 12 ? (
                    <span className="px-2 text-sm text-muted-foreground tabular-nums">
                      {page} / {totalPages}
                    </span>
                  ) : null}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={page >= totalPages}
                    asChild={page < totalPages}
                  >
                    {page < totalPages ? (
                      <Link href={`/team?page=${page + 1}`} aria-label="Наступна сторінка">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </nav>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <ConfirmModal
        open={pendingAction !== null}
        title={
          pendingAction?.type === "delete"
            ? "Підтвердити видалення"
            : "Підтвердити зміну ролі"
        }
        description={
          pendingAction?.type === "delete"
            ? `Ви дійсно хочете видалити ${pendingAction.memberName} з команди?`
            : pendingAction?.type === "role"
              ? `Змінити роль для ${pendingAction.memberName} на «${organizationRoleLabel(
                  pendingAction.nextRole,
                )}»?`
              : undefined
        }
        confirmLabel={
          pendingAction?.type === "delete" ? "Видалити" : "Підтвердити"
        }
        confirmVariant={
          pendingAction?.type === "delete" ? "destructive" : "default"
        }
        loading={isConfirmBusy}
        onClose={() => {
          if (pendingAction?.type === "role") {
            setRoleDrafts((prev) => ({
              ...prev,
              [pendingAction.membershipId]: pendingAction.prevRole,
            }));
          }
          setPendingAction(null);
        }}
        onConfirm={async () => {
          if (!pendingAction) {
            return;
          }
          if (pendingAction.type === "role") {
            const promise = updateRole.mutateAsync({
              tenantId,
              membershipId: pendingAction.membershipId,
              role: pendingAction.nextRole,
            });
            toast.promise(promise, {
              pending: "Змінюємо роль...",
              success: "Роль оновлено",
              error: "Не вдалося змінити роль. Перевірте права доступу.",
            });
            try {
              await promise;
            } catch {
              setRoleDrafts((prev) => ({
                ...prev,
                [pendingAction.membershipId]: pendingAction.prevRole,
              }));
            }
            setPendingAction(null);
            return;
          }

          const promise = removeMember.mutateAsync({
            tenantId,
            membershipId: pendingAction.membershipId,
          });
          toast.promise(promise, {
            pending: "Видаляємо користувача...",
            success: "Користувача видалено",
            error: "Не вдалося видалити користувача. Перевірте права доступу.",
          });
          try {
            await promise;
          } finally {
            setPendingAction(null);
          }
        }}
      />
    </motion.div>
  );
}
