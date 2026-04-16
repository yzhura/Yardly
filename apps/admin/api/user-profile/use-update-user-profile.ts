"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { UpdateUserProfilePayload, UserProfileResponse } from "@/api/user-profile/types";

async function patchProfile(body: UpdateUserProfilePayload): Promise<UserProfileResponse> {
  const { data } = await apiClient.patch<UserProfileResponse>("/api/users/me/profile", body);
  return data;
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
