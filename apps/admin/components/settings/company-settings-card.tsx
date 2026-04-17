"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { TenantLogoBadge } from "@/components/common/tenant-logo-badge";
import { useCreateTenantLogoSignedUpload, useUpdateTenantSettings } from "@/api/tenant-settings/use-tenant-settings-actions";
import { useTenantSettings } from "@/api/tenant-settings/use-tenant-settings";
import {
  TENANT_LOGO_UPLOAD_ACCEPT_ATTR,
  TENANT_LOGO_UPLOAD_MAX_BYTES,
  TENANT_LOGO_UPLOAD_MIME_TYPES,
} from "@/constants/tenant-logo-upload";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  tenantId: string;
  canManage: boolean;
};

export function CompanySettingsCard({ tenantId, canManage }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, refetch } = useTenantSettings(tenantId);
  const updateSettings = useUpdateTenantSettings();
  const createSignedUpload = useCreateTenantLogoSignedUpload();
  const [companyName, setCompanyName] = useState("");
  const [logoStoragePath, setLogoStoragePath] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [nameDirty, setNameDirty] = useState(false);

  const tenant = data?.tenant ?? null;
  const uploadBusy = createSignedUpload.isPending;
  const saveBusy = updateSettings.isPending;
  const formBusy = uploadBusy || saveBusy;

  useEffect(() => {
    if (!tenant) {
      return;
    }
    if (nameDirty) {
      return;
    }
    setCompanyName(tenant.name);
  }, [tenant, nameDirty]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  async function uploadLogo(file: File) {
    if (!(TENANT_LOGO_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Дозволені лише JPEG, PNG або WebP.");
      return;
    }
    if (file.size > TENANT_LOGO_UPLOAD_MAX_BYTES) {
      toast.error("Файл завеликий. Максимум 2 МБ.");
      return;
    }

    try {
      const sig = await createSignedUpload.mutateAsync({
        tenantId,
        mimeType: file.type,
      });
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(sig.bucket)
        .uploadToSignedUrl(sig.path, sig.token, file, { contentType: file.type });
      if (error) {
        throw error;
      }
      setLogoPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(file);
      });
      setLogoStoragePath(sig.storagePath ?? sig.path);
    } catch {
      toast.error("Не вдалося завантажити логотип.");
    }
  }

  function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void uploadLogo(file);
    }
  }

  async function onSave() {
    if (!canManage) {
      return;
    }
    if (companyName.trim().length === 0) {
      toast.error("Вкажіть назву компанії.");
      return;
    }
    const promise = updateSettings.mutateAsync({
      tenantId,
      name: companyName.trim(),
      logoUrl: logoStoragePath ?? tenant?.logoUrl ?? null,
    });
    await toast.promise(promise, {
      pending: "Зберігаємо налаштування компанії...",
      success: "Налаштування компанії оновлено",
      error: "Не вдалося зберегти налаштування компанії",
    });
    setLogoPreviewUrl(null);
    setNameDirty(false);
    router.refresh();
  }

  async function onClearLogo() {
    setLogoStoragePath(null);
    setLogoPreviewUrl(null);
    if (!canManage) {
      return;
    }
    const promise = updateSettings.mutateAsync({
      tenantId,
      logoUrl: null,
    });
    await toast.promise(promise, {
      pending: "Оновлюємо логотип...",
      success: "Логотип видалено",
      error: "Не вдалося оновити логотип",
    });
    router.refresh();
  }

  const currentLogo = logoPreviewUrl ?? tenant?.resolvedLogoUrl ?? null;
  if (isError) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Компанія</CardTitle>
          <CardDescription>Не вдалося завантажити налаштування компанії.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Спробувати знову
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Компанія</CardTitle>
        <CardDescription>
          Назва та логотип компанії для відображення в адмін-панелі.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <TenantLogoBadge
            logoUrl={currentLogo}
            size="lg"
            variant="header"
            className="bg-muted/50"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={TENANT_LOGO_UPLOAD_ACCEPT_ATTR}
              className="sr-only"
              aria-hidden
              tabIndex={-1}
              onChange={onPickFile}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!canManage || formBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="mr-2 h-4 w-4" aria-hidden />
              )}
              Завантажити логотип
            </Button>
            <Button type="button" variant="ghost" disabled={!canManage || formBusy} onClick={() => void onClearLogo()}>
              Прибрати логотип
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-w-xl">
          <p className="text-sm font-medium text-foreground">Назва компанії</p>
          <Input
            value={companyName}
            onChange={(event) => {
              setCompanyName(event.target.value);
              setNameDirty(true);
            }}
            placeholder="Введіть назву компанії"
            maxLength={120}
            disabled={!canManage || isLoading || formBusy}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={!canManage || isLoading || formBusy}
            className="min-w-[170px]"
          >
            {saveBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Збереження...
              </>
            ) : (
              "Зберегти зміни"
            )}
          </Button>
        </div>

        {!canManage ? (
          <p className="text-xs text-muted-foreground">
            Лише власник або адміністратор може змінювати налаштування компанії.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
