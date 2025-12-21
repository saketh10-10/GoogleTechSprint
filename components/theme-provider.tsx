"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize theme on mount
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme) {
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.classList.toggle("dark", systemPrefersDark);
    }
  }, []);

  return <>{children}</>;
}
