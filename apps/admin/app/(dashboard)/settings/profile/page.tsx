import { UserProfileSettingsCard } from "@/components/settings/user-profile-settings-card";
import { requireActiveMembership } from "@/lib/require-active-membership";

export default async function UserProfileSettingsPage() {
  await requireActiveMembership();

  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Персональний профіль
        </h1>
        <p className="mt-2 text-muted-foreground">
          Керуйте імʼям, прізвищем, аватаром та псевдонімом у поточній організації.
          Електронна пошта відображається лише для перегляду.
        </p>
      </div>

      <UserProfileSettingsCard />
    </div>
  );
}
