import { useEffect, useState } from "react";

const THEME_KEY = "cadence-theme";

/**
 * Whether the page is in dark mode, and a toggle that flips it and remembers
 * the choice for the theme script in `root.tsx`.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  }

  return { isDark, toggleDarkMode };
}
