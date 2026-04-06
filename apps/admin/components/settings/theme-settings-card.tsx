"use client";

import type { ComponentType } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/components/providers/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "light", label: "Світла", icon: Sun },
  { value: "dark", label: "Темна", icon: Moon },
  { value: "system", label: "Як у системі", icon: Monitor },
];

export function ThemeSettingsCard() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Тема інтерфейсу</CardTitle>
        <CardDescription>
          Оберіть тему адмін-панелі: світла, темна або автоматично за налаштуванням системи.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-w-xs">
          <Select value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
            <SelectTrigger aria-label="Вибір теми">
              <SelectValue placeholder="Оберіть тему" />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" aria-hidden />
                      {option.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          Поточна активна тема: {resolvedTheme === "dark" ? "Темна" : "Світла"}
          {theme === "system" ? " (режим системи)" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
