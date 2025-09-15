
"use client"

import * as React from "react"
import { useTheme } from "@/hooks/use-theme"
import { Moon, Sun, Contrast } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
        setTheme('dark');
    } else if (theme === 'dark') {
        setTheme('grayscale');
    } else {
        setTheme('light');
    }
  }
  
  return (
    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={cycleTheme} title="Toggle theme">
        <Sun className={cn("h-5 w-5", theme !== 'light' && 'hidden')} />
        <Moon className={cn("h-5 w-5", theme !== 'dark' && 'hidden')} />
        <Contrast className={cn("h-5 w-5", theme !== 'grayscale' && 'hidden')} />
        <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
