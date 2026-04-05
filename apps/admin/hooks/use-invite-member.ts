"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { inviteMemberAction } from "@/app/actions/invite";
import { INVITE_ERROR_CODES } from "@/constants/team-invite";
import { InviteMutationError } from "@/lib/invite-mutation-error";
import type { TeamInviteFormValues } from "@/lib/schemas/team-invite";

export function useInviteMember() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: TeamInviteFormValues) => {
      const result = await inviteMemberAction(values);
      if (!result.ok) {
        throw new InviteMutationError(result.code);
      }
    },
    onError: (error) => {
      if (error instanceof InviteMutationError) {
        if (error.code === INVITE_ERROR_CODES.NO_SESSION) {
          router.push("/login");
        } else if (error.code === INVITE_ERROR_CODES.NO_TENANT) {
          router.push("/select-organization");
        }
      }
    },
  });
}
