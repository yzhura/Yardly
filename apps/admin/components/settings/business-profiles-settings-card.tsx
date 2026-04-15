"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Eye, EyeOff, Pencil, ReceiptText, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "react-toastify";
import {
  useActivateBusinessProfile,
  useCreateBusinessProfile,
  useUpdateBusinessProfile,
  useUpsertIntegrationSecret,
} from "@/api/business-profiles/use-business-profile-actions";
import { useBusinessProfiles } from "@/api/business-profiles/use-business-profiles";
import type {
  BusinessProfileDto,
  IntegrationSecretKey,
} from "@/api/business-profiles/types";
import { BUSINESS_PROFILE_UI } from "@/constants/business-profiles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APPLE_SPRING, MOTION_DURATION, MOTION_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  emptyDraft,
  hiddenDraft,
  INTEGRATION_DEFS,
  type IntegrationField,
} from "@/components/settings/business-profile-integrations";

type Props = {
  tenantId: string;
  canManage: boolean;
};

type BusinessProfileFormState = {
  displayName: string;
  legalName: string;
  taxId: string;
  registrationNumber: string;
};

export function BusinessProfilesSettingsCard({ tenantId, canManage }: Props) {
  const { data, isError } = useBusinessProfiles(tenantId);
  const createProfile = useCreateBusinessProfile();
  const activateProfile = useActivateBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();
  const upsertSecret = useUpsertIntegrationSecret();

  const profiles = useMemo(() => data?.profiles ?? [], [data?.profiles]);
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.isActive) ?? null,
    [profiles],
  );

  const [newProfileName, setNewProfileName] = useState("");
  const [newLegalName, setNewLegalName] = useState("");
  const [newTaxId, setNewTaxId] = useState("");
  const [newRegistrationNumber, setNewRegistrationNumber] = useState("");
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editLegalName, setEditLegalName] = useState("");
  const [editTaxId, setEditTaxId] = useState("");
  const [editRegistrationNumber, setEditRegistrationNumber] = useState("");
  const [draftKeys, setDraftKeys] = useState<
    Record<IntegrationSecretKey, string>
  >({
    ...emptyDraft,
  });
  const [hiddenSecrets, setHiddenSecrets] = useState<
    Record<IntegrationSecretKey, boolean>
  >({
    ...hiddenDraft,
  });
  const [activeIntegrationProvider, setActiveIntegrationProvider] = useState<
    "NOVA_POSHTA" | "CHECKBOX" | null
  >(null);
  const [isAddProfileModalOpen, setAddProfileModalOpen] = useState(false);
  const [isSwitchProfileModalOpen, setSwitchProfileModalOpen] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);

  const currentProfile = activeProfile;
  const currentProfileId = currentProfile?.id ?? "";

  if (isError) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{BUSINESS_PROFILE_UI.title}</CardTitle>
          <CardDescription>
            Не вдалося завантажити профілі бізнесу. Оновіть сторінку і спробуйте
            ще раз.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeIntegrationDef =
    activeIntegrationProvider === null
      ? null
      : (INTEGRATION_DEFS.find(
          (item) => item.provider === activeIntegrationProvider,
        ) ?? null);

  async function onCreateProfile() {
    const name = newProfileName.trim();
    if (!name) {
      toast.error("Вкажіть назву профілю бізнесу.");
      return;
    }

    const promise = createProfile.mutateAsync({
      tenantId,
      displayName: name,
      legalName: newLegalName.trim() || undefined,
      taxId: newTaxId.trim() || undefined,
      registrationNumber: newRegistrationNumber.trim() || undefined,
    });
    toast.promise(promise, {
      pending: "Додаємо профіль...",
      success: "Профіль створено",
      error: "Не вдалося створити профіль",
    });
    await promise;
    setNewProfileName("");
    setNewLegalName("");
    setNewTaxId("");
    setNewRegistrationNumber("");
    setAddProfileModalOpen(false);
  }

  async function onSaveSecret(field: IntegrationField) {
    if (!currentProfileId) {
      toast.error("Оберіть профіль бізнесу.");
      return;
    }
    const secret = draftKeys[field.keyName].trim();
    if (secret.length < 8) {
      toast.error("Ключ має містити щонайменше 8 символів.");
      return;
    }

    const promise = upsertSecret.mutateAsync({
      tenantId,
      profileId: currentProfileId,
      provider: activeIntegrationProvider as "NOVA_POSHTA" | "CHECKBOX",
      keyName: field.keyName,
      secret,
    });
    await promise;
    setDraftKeys((prev) => ({ ...prev, [field.keyName]: "" }));
  }

  function openEditProfile(profile: BusinessProfileDto) {
    setEditProfileId(profile.id);
    setEditProfileName(profile.displayName);
    setEditLegalName(profile.legalName ?? "");
    setEditTaxId(profile.taxId ?? "");
    setEditRegistrationNumber(profile.registrationNumber ?? "");
    setEditProfileModalOpen(true);
  }

  async function onUpdateProfile() {
    if (!editProfileId) {
      return;
    }
    const displayName = editProfileName.trim();
    if (!displayName) {
      toast.error("Вкажіть назву профілю.");
      return;
    }

    const promise = updateProfile.mutateAsync({
      tenantId,
      profileId: editProfileId,
      displayName,
      legalName: editLegalName.trim() || undefined,
      taxId: editTaxId.trim() || undefined,
      registrationNumber: editRegistrationNumber.trim() || undefined,
    });
    toast.promise(promise, {
      pending: "Оновлюємо профіль...",
      success: "Профіль оновлено",
      error: "Не вдалося оновити профіль",
    });
    await promise;
    setEditProfileModalOpen(false);
  }

  function credentialFor(
    profile: BusinessProfileDto | null,
    keyName: IntegrationSecretKey,
  ) {
    if (!profile) {
      return null;
    }
    return profile.credentials.find((item) => item.keyName === keyName) ?? null;
  }

  async function onSaveIntegrationSettings() {
    if (!activeIntegrationDef || !currentProfileId) {
      return;
    }
    const pendingFields = activeIntegrationDef.fields.filter(
      (field) => draftKeys[field.keyName].trim().length > 0,
    );
    if (pendingFields.length === 0) {
      toast.info("Вкажіть хоча б один ключ для збереження.");
      return;
    }

    const promise = Promise.all(
      pendingFields.map((field) => onSaveSecret(field)),
    );
    toast.promise(promise, {
      pending: "Зберігаємо налаштування інтеграції...",
      success: "Налаштування оновлено",
      error: "Не вдалося зберегти налаштування",
    });
    await promise;
    setActiveIntegrationProvider(null);
  }

  function integrationState(provider: "NOVA_POSHTA" | "CHECKBOX") {
    if (!currentProfile) {
      return { enabled: false, configuredCount: 0, totalCount: 0 };
    }
    const def = INTEGRATION_DEFS.find((item) => item.provider === provider);
    if (!def || def.fields.length === 0) {
      return { enabled: false, configuredCount: 0, totalCount: 0 };
    }
    const configuredCount = def.fields.filter(
      (field) => credentialFor(currentProfile, field.keyName) !== null,
    ).length;
    return {
      enabled: configuredCount === def.fields.length,
      configuredCount,
      totalCount: def.fields.length,
    };
  }

  function integrationActionLabel(state: {
    enabled: boolean;
    configuredCount: number;
  }) {
    if (state.enabled) {
      return "Налаштувати";
    }
    if (state.configuredCount > 0) {
      return "Дозаповнити";
    }
    return "Підключити";
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">
          Керування бізнесом
        </h2>
        <p className="text-sm text-muted-foreground">
          {BUSINESS_PROFILE_UI.description}
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Активний бізнес
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {activeProfile?.displayName ?? "Немає активного профілю"}
                </p>
                <p className="text-sm text-emerald-600">
                  {activeProfile
                    ? "Поточний статус: Активний ФОП"
                    : "Додайте профіль бізнесу"}
                </p>
              </div>
            </div>
            {canManage ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
                {profiles.length === 0 ? (
                  <Button
                    type="button"
                    onClick={() => setAddProfileModalOpen(true)}
                  >
                    Додати профіль
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSwitchProfileModalOpen(true)}
                  >
                    Переключити профіль
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {activeProfile ? (
        <>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Інтеграції
            </h2>
            <p className="text-sm text-muted-foreground">
              Підключені сервіси для автоматизації логістики та продажів.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {INTEGRATION_DEFS.map((integration) => {
              const Icon = integration.iconName === "truck" ? Truck : ReceiptText;
              const state = integrationState(integration.provider);
              const enabled = state.enabled;
              return (
                <Card
                  key={integration.provider}
                  className="border-border shadow-sm"
                >
                  <CardContent className="space-y-4 pt-5">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                    </div>

                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        {integration.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {integration.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          enabled
                            ? "text-emerald-600"
                            : "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            enabled
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/50",
                          )}
                          aria-hidden
                        />
                        {enabled ? "Підключено" : "Вимкнено"}
                        {!enabled && state.configuredCount > 0
                          ? ` (${state.configuredCount}/${state.totalCount})`
                          : ""}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="px-2 text-primary"
                        disabled={!canManage}
                        onClick={() =>
                          setActiveIntegrationProvider(
                            integration.provider as "NOVA_POSHTA" | "CHECKBOX",
                          )
                        }
                      >
                        {integrationActionLabel(state)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : null}

      <SettingsModal
        open={isAddProfileModalOpen}
        title="Додати профіль"
        description="Вкажіть назву бізнес-профілю. Це єдине обов'язкове поле."
        confirmLabel={createProfile.isPending ? "Додаємо..." : "Додати профіль"}
        loading={createProfile.isPending}
        onClose={() => setAddProfileModalOpen(false)}
        onConfirm={() => {
          void onCreateProfile();
        }}
      >
        <BusinessProfileFormFields
          values={{
            displayName: newProfileName,
            legalName: newLegalName,
            taxId: newTaxId,
            registrationNumber: newRegistrationNumber,
          }}
          onChange={{
            displayName: setNewProfileName,
            legalName: setNewLegalName,
            taxId: setNewTaxId,
            registrationNumber: setNewRegistrationNumber,
          }}
        />
      </SettingsModal>

      <SettingsModal
        open={isSwitchProfileModalOpen}
        title="Переключити профіль"
        description="Оберіть профіль, який має стати активним."
        confirmLabel="Закрити"
        hidePrimaryAction
        onClose={() => setSwitchProfileModalOpen(false)}
        onConfirm={() => undefined}
      >
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{profile.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {profile.isActive ? "Активний" : "Неактивний"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEditProfile(profile)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                  Редагувати
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={profile.isActive || activateProfile.isPending}
                  onClick={() => {
                    if (profile.isActive) {
                      return;
                    }
                    const promise = activateProfile.mutateAsync({
                      tenantId,
                      profileId: profile.id,
                    });
                    toast.promise(promise, {
                      pending: "Перемикаємо профіль...",
                      success: "Активний профіль оновлено",
                      error: "Не вдалося перемкнути профіль",
                    });
                    setSwitchProfileModalOpen(false);
                  }}
                >
                  Активувати
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            onClick={() => {
              setSwitchProfileModalOpen(false);
              setAddProfileModalOpen(true);
            }}
          >
            Додати профіль
          </Button>
        </div>
      </SettingsModal>

      <SettingsModal
        open={isEditProfileModalOpen}
        title="Редагувати профіль"
        description="Оновіть дані профілю бізнесу."
        confirmLabel={updateProfile.isPending ? "Оновлюємо..." : "Зберегти зміни"}
        loading={updateProfile.isPending}
        onClose={() => setEditProfileModalOpen(false)}
        onConfirm={() => {
          void onUpdateProfile();
        }}
      >
        <BusinessProfileFormFields
          values={{
            displayName: editProfileName,
            legalName: editLegalName,
            taxId: editTaxId,
            registrationNumber: editRegistrationNumber,
          }}
          onChange={{
            displayName: setEditProfileName,
            legalName: setEditLegalName,
            taxId: setEditTaxId,
            registrationNumber: setEditRegistrationNumber,
          }}
        />
      </SettingsModal>

      <SettingsModal
        open={activeIntegrationDef !== null}
        title={
          activeIntegrationDef
            ? `${activeIntegrationDef.title}: налаштування`
            : "Налаштування інтеграції"
        }
        description="Заповніть секрети для обраного бізнес-профілю."
        confirmLabel={upsertSecret.isPending ? "Зберігаємо..." : "Зберегти"}
        loading={upsertSecret.isPending}
        onClose={() => setActiveIntegrationProvider(null)}
        onConfirm={() => {
          void onSaveIntegrationSettings();
        }}
      >
        <div className="space-y-3">
          {activeIntegrationDef?.fields.map((field) => {
            const existing = credentialFor(currentProfile, field.keyName);
            return (
              <div key={field.keyName} className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  {field.label}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type={hiddenSecrets[field.keyName] ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={draftKeys[field.keyName]}
                    onChange={(event) =>
                      setDraftKeys((prev) => ({
                        ...prev,
                        [field.keyName]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={
                      hiddenSecrets[field.keyName]
                        ? "Показати ключ"
                        : "Сховати ключ"
                    }
                    onClick={() =>
                      setHiddenSecrets((prev) => ({
                        ...prev,
                        [field.keyName]: !prev[field.keyName],
                      }))
                    }
                  >
                    {hiddenSecrets[field.keyName] ? (
                      <Eye className="h-4 w-4" aria-hidden />
                    ) : (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {existing
                    ? `Поточне значення: ${existing.maskedValue}`
                    : "Ще не налаштовано"}
                </p>
              </div>
            );
          })}
        </div>
      </SettingsModal>
    </div>
  );
}

type SettingsModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  loading?: boolean;
  hidePrimaryAction?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
};

function SettingsModal({
  open,
  title,
  description,
  confirmLabel,
  loading = false,
  hidePrimaryAction = false,
  onClose,
  onConfirm,
  children,
}: SettingsModalProps) {
  const canUsePortal = typeof window !== "undefined";

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, loading]);

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
          onClick={() => {
            if (!loading) {
              onClose();
            }
          }}
          role="presentation"
        >
          <motion.div
            className="w-full max-w-xl rounded-2xl border border-border/90 bg-background p-5 shadow-2xl"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{
              ...APPLE_SPRING,
              opacity: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
            }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
            <div className="mt-4">{children}</div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Скасувати
              </Button>
              {hidePrimaryAction ? null : (
                <Button type="button" onClick={onConfirm} disabled={loading}>
                  {loading ? "Зачекайте..." : confirmLabel}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (!canUsePortal) {
    return modal;
  }
  return createPortal(modal, document.body);
}

type BusinessProfileFormFieldsProps = {
  values: BusinessProfileFormState;
  onChange: {
    displayName: (value: string) => void;
    legalName: (value: string) => void;
    taxId: (value: string) => void;
    registrationNumber: (value: string) => void;
  };
};

function BusinessProfileFormFields({
  values,
  onChange,
}: BusinessProfileFormFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Назва профілю *</p>
        <Input
          value={values.displayName}
          onChange={(event) => onChange.displayName(event.target.value)}
          placeholder="Назва профілю"
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Юридична назва</p>
        <Input
          value={values.legalName}
          onChange={(event) => onChange.legalName(event.target.value)}
          placeholder="ФОП / ТОВ (необов'язково)"
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">ІПН / ЄДРПОУ</p>
        <Input
          value={values.taxId}
          onChange={(event) => onChange.taxId(event.target.value)}
          placeholder="Необов'язково"
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Реєстраційний номер</p>
        <Input
          value={values.registrationNumber}
          onChange={(event) => onChange.registrationNumber(event.target.value)}
          placeholder="Необов'язково"
        />
      </div>
    </div>
  );
}
