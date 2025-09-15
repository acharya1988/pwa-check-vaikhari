
"use client"

import * as React from "react"
import { ThemeProviderContext } from "@/hooks/use-theme";

type Theme = "dark" | "light" | "grayscale"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vaikhari-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme && ["light", "dark", "grayscale"].includes(storedTheme)) {
        setTheme(storedTheme);
      }
    } catch (e) {
      // LocalStorage is not available
    }
  }, [storageKey]);
  
  React.useEffect(() => {
    if (isMounted) {
        const root = window.document.documentElement
        root.removeAttribute("data-theme")
        root.setAttribute("data-theme", theme)
    }
  }, [theme, isMounted])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme)
      } catch (e) {
        // Ignore localStorage errors
      }
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
