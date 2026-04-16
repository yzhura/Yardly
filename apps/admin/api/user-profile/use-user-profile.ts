"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { UserProfileResponse } from "@/api/user-profile/types";

async function fetchProfile(): Promise<UserProfileResponse> {
  const { data } = await apiClient.get<UserProfileResponse>("/api/users/me/profile");
  return data;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchProfile,
    staleTime: 30_000,
  });
}
