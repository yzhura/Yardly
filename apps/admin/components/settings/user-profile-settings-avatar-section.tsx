"use client";

import type { ChangeEvent, RefObject } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  presetAvatarAriaLabel,
  presetAvatarObjectUrl,
  USER_PROFILE_PRESET_IDS,
  type UserProfilePresetId,
} from "@/constants/user-profile-presets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type UserProfileAvatarMode = "none" | "preset" | "custom";

export type UserProfileSettingsAvatarSectionProps = {
  isLoading: boolean;
  previewSrc: string | null;
  fallbackLetter: string;
  uploadBusy: boolean;
  savePending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  acceptMime: string;
  onPickFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearAvatar: () => void;
  onSelectPreset: (id: UserProfilePresetId) => void;
  avatarMode: UserProfileAvatarMode;
  selectedPreset: UserProfilePresetId | null;
};

export function UserProfileSettingsAvatarSection({
  isLoading,
  previewSrc,
  fallbackLetter,
  uploadBusy,
  savePending,
  fileInputRef,
  acceptMime,
  onPickFile,
  onClearAvatar,
  onSelectPreset,
  avatarMode,
  selectedPreset,
}: UserProfileSettingsAvatarSectionProps) {
  const formBusy = savePending || uploadBusy;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Аватар</CardTitle>
        <CardDescription>Завантажте власне фото або оберіть варіант з набору.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-4" aria-label="Завантаження аватара">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/50 text-lg font-semibold text-muted-foreground"
                aria-label="Поточний аватар"
              >
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden>{fallbackLetter}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptMime}
                  className="sr-only"
                  aria-hidden
                  tabIndex={-1}
                  onChange={onPickFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadBusy || savePending}
                  onClick={() => fileInputRef.current?.click()}
                  aria-busy={uploadBusy || undefined}
                >
                  {uploadBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Завантажити
                </Button>
                <Button type="button" variant="ghost" disabled={formBusy} onClick={onClearAvatar}>
                  Без аватара
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Оберіть з набору</p>
              <div
                className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9"
                role="listbox"
                aria-label="Пресети аватара"
              >
                {USER_PROFILE_PRESET_IDS.map((id) => {
                  const selected = avatarMode === "preset" && selectedPreset === id;
                  const src = presetAvatarObjectUrl(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={!src}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-xl border-2 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
                        selected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-border",
                      )}
                      onClick={() => onSelectPreset(id)}
                      aria-label={presetAvatarAriaLabel(id)}
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">?</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
