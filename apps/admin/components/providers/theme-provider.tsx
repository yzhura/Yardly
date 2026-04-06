"use client";

import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "yardly-theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (value: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return theme;
}

function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  const resolved = resolveTheme(theme);
  root.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    "light",
  );

  React.useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const initialTheme: ThemeMode =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
        ? storedTheme
        : "system";

    setThemeState(initialTheme);
    const nextResolved = resolveTheme(initialTheme);
    setResolvedTheme(nextResolved);
    applyThemeClass(initialTheme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (initialTheme === "system" || localStorage.getItem(THEME_STORAGE_KEY) === "system") {
        const updatedResolved = media.matches ? "dark" : "light";
        setResolvedTheme(updatedResolved);
        document.documentElement.classList.toggle("dark", updatedResolved === "dark");
      }
    };

    media.addEventListener("change", handleSystemThemeChange);

    return () => {
      media.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const setTheme = React.useCallback((value: ThemeMode) => {
    setThemeState(value);
    localStorage.setItem(THEME_STORAGE_KEY, value);
    const nextResolved = resolveTheme(value);
    setResolvedTheme(nextResolved);
    applyThemeClass(value);
  }, []);

  const contextValue = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
