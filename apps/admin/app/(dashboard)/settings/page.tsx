import { ThemeSettingsCard } from "@/components/settings/theme-settings-card";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Налаштування
        </h1>
        <p className="mt-2 text-muted-foreground">
          Керуйте параметрами інтерфейсу та персоналізацією адмін-панелі.
        </p>
      </div>

      <ThemeSettingsCard />
    </div>
  );
}
