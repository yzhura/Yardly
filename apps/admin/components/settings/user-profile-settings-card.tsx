"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useUpdateUserProfile } from "@/api/user-profile/use-update-user-profile";
import { useUserProfile } from "@/api/user-profile/use-user-profile";
import type { AvatarSignedUploadResponse } from "@/api/user-profile/types";
import { apiClient } from "@/api/client";
import {
  isUserProfilePresetId,
  presetAvatarObjectUrl,
  type UserProfilePresetId,
} from "@/constants/user-profile-presets";
import {
  USER_PROFILE_UPLOAD_ACCEPT_ATTR,
  USER_PROFILE_UPLOAD_MAX_BYTES,
  USER_PROFILE_UPLOAD_MIME_TYPES,
} from "@/constants/user-profile-upload";
import {
  userProfileFormSchema,
  type UserProfileFormValues,
} from "@/constants/user-profile-schema";
import { UserProfileSettingsAvatarSection } from "@/components/settings/user-profile-settings-avatar-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { isHttpAvatarReference } from "@/lib/avatar-url";
import { createClient } from "@/lib/supabase/client";

function inferAvatarMode(profile: {
  avatarUrl: string | null;
  avatarPresetId: string | null;
}): {
  mode: "none" | "preset" | "custom";
  preset: UserProfilePresetId | null;
  customStoragePath: string | null;
} {
  if (profile.avatarUrl) {
    return {
      mode: "custom",
      preset: null,
      customStoragePath: profile.avatarUrl,
    };
  }
  if (profile.avatarPresetId && isUserProfilePresetId(profile.avatarPresetId)) {
    return {
      mode: "preset",
      preset: profile.avatarPresetId,
      customStoragePath: null,
    };
  }
  return { mode: "none", preset: null, customStoragePath: null };
}

export function UserProfileSettingsCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: profile, isLoading, isError, refetch } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [avatarMode, setAvatarMode] = useState<"none" | "preset" | "custom">(
    "none",
  );
  const [selectedPreset, setSelectedPreset] =
    useState<UserProfilePresetId | null>(null);
  const [customStoragePath, setCustomStoragePath] = useState<string | null>(
    null,
  );
  const [avatarPreviewBlobUrl, setAvatarPreviewBlobUrl] = useState<
    string | null
  >(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const form = useForm<UserProfileFormValues>({
    resolver: yupResolver(userProfileFormSchema),
    defaultValues: { firstName: "", lastName: "" },
  });

  const resetPreviewBlob = useCallback(() => {
    setAvatarPreviewBlobUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }
    form.reset({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
    });
    if (avatarPreviewBlobUrl) {
      return;
    }
    const inferred = inferAvatarMode(profile);
    setAvatarMode(inferred.mode);
    setSelectedPreset(inferred.preset);
    setCustomStoragePath(inferred.customStoragePath);
  }, [profile, form, avatarPreviewBlobUrl]);

  useEffect(() => {
    return () => {
      if (avatarPreviewBlobUrl) {
        URL.revokeObjectURL(avatarPreviewBlobUrl);
      }
    };
  }, [avatarPreviewBlobUrl]);

  const previewSrc = useMemo(() => {
    if (avatarMode === "preset" && selectedPreset) {
      return presetAvatarObjectUrl(selectedPreset);
    }
    if (avatarMode !== "custom") {
      return null;
    }
    if (avatarPreviewBlobUrl) {
      return avatarPreviewBlobUrl;
    }
    if (customStoragePath && isHttpAvatarReference(customStoragePath)) {
      return customStoragePath;
    }
    return profile?.resolvedAvatarUrl ?? null;
  }, [
    avatarMode,
    avatarPreviewBlobUrl,
    customStoragePath,
    profile?.resolvedAvatarUrl,
    selectedPreset,
  ]);

  const formBusy = updateProfile.isPending || uploadBusy;

  const handleClearAvatar = useCallback(() => {
    resetPreviewBlob();
    setAvatarMode("none");
    setSelectedPreset(null);
    setCustomStoragePath(null);
  }, [resetPreviewBlob]);

  const handleSelectPreset = useCallback(
    (id: UserProfilePresetId) => {
      resetPreviewBlob();
      setAvatarMode("preset");
      setSelectedPreset(id);
      setCustomStoragePath(null);
    },
    [resetPreviewBlob],
  );

  async function uploadWithSignedUrl(file: File) {
    const mimeType = file.type;
    if (
      !(USER_PROFILE_UPLOAD_MIME_TYPES as readonly string[]).includes(mimeType)
    ) {
      toast.error("Дозволені лише JPEG, PNG або WebP.");
      return;
    }
    if (file.size > USER_PROFILE_UPLOAD_MAX_BYTES) {
      toast.error("Файл завеликий. Максимум 2 МБ.");
      return;
    }

    setUploadBusy(true);
    try {
      const { data: sig } = await apiClient.post<AvatarSignedUploadResponse>(
        "/api/users/me/avatar/signed-upload",
        { mimeType },
      );
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(sig.bucket)
        .uploadToSignedUrl(sig.path, sig.token, file, {
          contentType: mimeType,
        });
      if (error) {
        throw error;
      }
      setAvatarMode("custom");
      setCustomStoragePath(sig.storagePath ?? sig.path);
      setSelectedPreset(null);
      setAvatarPreviewBlobUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(file);
      });
    } catch {
      toast.error("Не вдалося завантажити файл. Спробуйте ще раз.");
    } finally {
      setUploadBusy(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      void uploadWithSignedUrl(file);
    }
  }

  async function onSubmit(values: UserProfileFormValues) {
    const payload = {
      firstName: values.firstName.trim() || null,
      lastName: values.lastName.trim() || null,
      avatarPresetId: null as string | null,
      avatarUrl: null as string | null,
    };

    if (avatarMode === "preset" && selectedPreset) {
      payload.avatarPresetId = selectedPreset;
      payload.avatarUrl = null;
    } else if (avatarMode === "custom" && customStoragePath) {
      payload.avatarUrl = customStoragePath;
      payload.avatarPresetId = null;
    } else {
      payload.avatarPresetId = null;
      payload.avatarUrl = null;
    }

    const promise = updateProfile.mutateAsync(payload);
    await toast.promise(promise, {
      pending: "Збереження…",
      success: "Профіль оновлено",
      error: "Не вдалося зберегти зміни",
    });
    resetPreviewBlob();
    router.refresh();
  }

  const fallbackLetter = (profile?.email?.trim()?.[0] ?? "?").toUpperCase();

  if (isError) {
    return (
      <Card className="border-destructive/40 shadow-sm" role="alert">
        <CardHeader>
          <CardTitle className="text-lg">Профіль</CardTitle>
          <CardDescription>
            Не вдалося завантажити дані профілю.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
          >
            Спробувати знову
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        aria-busy={isLoading || formBusy || undefined}
        aria-label="Редагування профілю"
      >
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Особисті дані</CardTitle>
            <CardDescription>
              Імʼя та прізвище відображаються в інтерфейсі.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4" aria-label="Завантаження форми">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-10 w-full max-w-md" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Імʼя</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="given-name"
                            placeholder="Олена"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Прізвище</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="family-name"
                            placeholder="Шевченко"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-settings-email">
                    Електронна пошта
                  </Label>
                  <Input
                    id="profile-settings-email"
                    readOnly
                    disabled
                    value={profile?.email ?? ""}
                    className="bg-muted/60 text-muted-foreground"
                    aria-readonly="true"
                  />
                  <p className="text-xs text-muted-foreground">
                    Пошту змінити не можна — вона привʼязана до облікового
                    запису.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserProfileSettingsAvatarSection
          isLoading={isLoading}
          previewSrc={previewSrc}
          fallbackLetter={fallbackLetter}
          uploadBusy={uploadBusy}
          savePending={updateProfile.isPending}
          fileInputRef={fileInputRef}
          acceptMime={USER_PROFILE_UPLOAD_ACCEPT_ATTR}
          onPickFile={onPickFile}
          onClearAvatar={handleClearAvatar}
          onSelectPreset={handleSelectPreset}
          avatarMode={avatarMode}
          selectedPreset={selectedPreset}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={isLoading || formBusy}
            className="min-w-[160px] sm:ml-auto"
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Збереження…
              </>
            ) : (
              "Зберегти зміни"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
