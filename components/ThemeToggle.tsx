"use client";

import { useTheme } from "../lib/theme-context";
import { Button } from "./ui/Button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="secondary" onClick={toggleTheme} title="Toggle theme">
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}
