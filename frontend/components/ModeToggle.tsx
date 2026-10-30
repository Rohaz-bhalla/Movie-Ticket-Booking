"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      {/* DropdownMenuTrigger already renders a <button>, so it is styled directly.
          No <Button> and no asChild: nesting buttons is what caused the hydration error.
          The icon swap is pure CSS (dark: classes), so server and client HTML match. */}
      <DropdownMenuTrigger
        aria-label="Toggle theme"
        className="grid h-10 w-10 cursor-pointer place-items-center rounded-full transition-colors hover:bg-m-on-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-on-primary"
      >
        <Sun className="h-5 w-5 dark:hidden" />
        <Moon className="hidden h-5 w-5 dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
