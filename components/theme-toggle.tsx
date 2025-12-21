"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get theme from localStorage or system preference
    const storedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;

    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const initialTheme = systemPrefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.classList.toggle(
        "dark",
        initialTheme === "dark"
      );
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:bg-secondary"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-foreground hover:bg-secondary transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 transition-transform duration-300 rotate-0" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-300 rotate-0" />
      )}
    </Button>
  );
}
