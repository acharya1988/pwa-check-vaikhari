'use client';
import React from 'react';
import type { Organization } from '@/types';
import { BookThemeProvider } from '@/components/theme/BookThemeContext';
import { ThemeSaraswati } from '@/components/organization-themes/ThemeSaraswati';
import { ThemeTantra } from '@/components/organization-themes/ThemeTantra';
import { ThemeWabiSabi } from '@/components/organization-themes/ThemeWabiSabi';

// A simple map to your theme components
const themeMap: Record<string, React.ComponentType<{ org: Organization }>> = {
  'Saraswati': ThemeSaraswati,
  'Tantra': ThemeTantra,
  'WabiSabi': ThemeWabiSabi,
};

// Renamed the component to avoid any potential naming conflicts that might cause import issues.
export function OrganizationOnePageRenderer({ org }: { org: Organization | null }) {
    if (!org) {
        return (
             <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Organization Not Found</h1>
                    <p className="text-muted-foreground">The requested organization could not be loaded.</p>
                </div>
            </div>
        )
    }

    const ThemeComponent = themeMap[org.theme || 'Saraswati'] || ThemeSaraswati;

    return (
        <BookThemeProvider theme={org.themeObject}>
            <ThemeComponent org={org} />
        </BookThemeProvider>
    );
}

// Default export remains for backwards compatibility if needed elsewhere, but named export is preferred.
export default OrganizationOnePageRenderer;
