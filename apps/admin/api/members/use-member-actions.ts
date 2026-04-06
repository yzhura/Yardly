"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { TenantMemberRole } from "@/api/members/types";

type UpdateRoleInput = {
  tenantId: string;
  membershipId: string;
  role: TenantMemberRole;
};

type RemoveMemberInput = {
  tenantId: string;
  membershipId: string;
};

type ReactivateMemberInput = {
  tenantId: string;
  membershipId: string;
};

async function updateMemberRole(input: UpdateRoleInput) {
  const { data } = await apiClient.patch(
    `/api/tenants/${input.tenantId}/members/${input.membershipId}`,
    { role: input.role },
  );
  return data;
}

async function reactivateMember(input: ReactivateMemberInput) {
  const { data } = await apiClient.patch(
    `/api/tenants/${input.tenantId}/members/${input.membershipId}`,
    { status: "ACTIVE" },
  );
  return data as { member: { id: string; status: "ACTIVE" } };
}

async function removeMember(input: RemoveMemberInput) {
  const { data } = await apiClient.delete(
    `/api/tenants/${input.tenantId}/members/${input.membershipId}`,
  );
  return data as { member: { id: string; status: "DEACTIVATED" } };
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMemberRole,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.tenantId],
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.tenantId],
      });
    },
  });
}

export function useReactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivateMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.tenantId],
      });
    },
  });
}
