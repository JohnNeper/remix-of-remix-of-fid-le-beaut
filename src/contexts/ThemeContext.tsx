import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type ThemeColor = "zinc" | "rose" | "blue" | "green" | "orange";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColor?: ThemeColor;
  storageKey?: string;
  colorStorageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  color: "zinc",
  setColor: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultColor = "zinc",
  storageKey = "vite-ui-theme",
  colorStorageKey = "vite-ui-color",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [color, setColor] = useState<ThemeColor>(
    () => (localStorage.getItem(colorStorageKey) as ThemeColor) || defaultColor
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // Apply dark/light class
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove previous color classes
    root.classList.remove("theme-zinc", "theme-rose", "theme-blue", "theme-green", "theme-orange");
    // Add new color class
    root.classList.add(`theme-${color}`);
  }, [color]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    color,
    setColor: (color: ThemeColor) => {
      localStorage.setItem(colorStorageKey, color);
      setColor(color);
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
