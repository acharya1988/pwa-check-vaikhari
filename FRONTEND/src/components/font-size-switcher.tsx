
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function FontSizeSwitcher({ onFontSizeChange, fontSize }: { onFontSizeChange: (change: number) => void; fontSize: number; }) {
    const handleFontSizeChange = (change: number) => {
        if (change === 0) {
            onFontSizeChange(18); // Reset to default
        } else {
            onFontSizeChange(Math.max(12, Math.min(32, fontSize + change)));
        }
    };
    return (
         <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={() => handleFontSizeChange(-1)} aria-label="Decrease font size">
                A-
            </Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={() => handleFontSizeChange(0)} aria-label="Reset font size">
                A
            </Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0" onClick={() => handleFontSizeChange(1)} aria-label="Increase font size">
                A+
            </Button>
        </div>
    );
}
