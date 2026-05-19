"use client";

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export function ThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: string }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={initialTheme || "system"}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
