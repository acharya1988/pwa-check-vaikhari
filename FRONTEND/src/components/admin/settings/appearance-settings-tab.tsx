
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SCRIPT_DEFINITIONS, useTransliteration } from '@/components/transliteration-provider';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export function AppearanceSettingsTab() {
    const { targetScript, setTargetScript } = useTransliteration();

    return (
        <Card>
            <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize the look and feel of the application.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <Label>Global Theme</Label>
                    <ThemeSwitcher />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="defaultScript">Default Transliteration Script</Label>
                        <Select value={targetScript} onValueChange={setTargetScript}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(SCRIPT_DEFINITIONS).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
