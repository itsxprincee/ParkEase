import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const THEMES = [
  { id: "light", label: "Light", icon: "☀️", desc: "Clean & bright" },
  { id: "dark", label: "Dark", icon: "🌙", desc: "Obsidian dark mode" },
  { id: "midnight", label: "Midnight", icon: "🌌", desc: "Cyber blue deep dark" },
  { id: "system", label: "System", icon: "💻", desc: "Match device setting" },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem("parkease_theme");
      if (saved && ["light", "dark", "midnight", "system"].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "dark"; // Default to Obsidian Dark mode
  });

  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const computeEffective = (currentTheme) => {
      if (currentTheme === "system") {
        return mediaQuery.matches ? "dark" : "light";
      }
      return currentTheme;
    };

    const effective = computeEffective(theme);
    setResolvedTheme(effective);

    // Apply classes and attributes
    root.classList.remove("light", "dark", "theme-midnight", "theme-dark", "theme-light");

    if (effective === "dark") {
      root.classList.add("dark", "theme-dark");
      root.setAttribute("data-theme", "dark");
    } else if (effective === "midnight") {
      root.classList.add("dark", "theme-midnight");
      root.setAttribute("data-theme", "midnight");
    } else {
      root.classList.add("light", "theme-light");
      root.setAttribute("data-theme", "light");
    }

    try {
      localStorage.setItem("parkease_theme", theme);
    } catch {
      // ignore
    }

    const listener = () => {
      if (theme === "system") {
        const sysEffective = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(sysEffective);
        root.classList.remove("light", "dark", "theme-midnight", "theme-dark", "theme-light");
        if (sysEffective === "dark") {
          root.classList.add("dark", "theme-dark");
          root.setAttribute("data-theme", "dark");
        } else {
          root.classList.add("light", "theme-light");
          root.setAttribute("data-theme", "light");
        }
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "midnight";
      if (prev === "midnight") return "dark";
      return "dark";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
