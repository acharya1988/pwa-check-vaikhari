
'use client';

import { useTransliteration, SCRIPT_DEFINITIONS } from '@/components/transliteration-provider';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const INDIC_SCRIPTS = ['DEVANAGARI', 'KANNADA', 'TELUGU', 'TAMIL', 'MALAYALAM', 'GUJARATI', 'BENGALI', 'GURMUKHI'];
const ROMAN_SCRIPTS = ['IAST', 'ITRANS', 'HK', 'SLP1'];

export function ScriptSwitcher() {
  const { setTargetScript } = useTransliteration();

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Switch Script">
                <Languages className="h-5 w-5" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Indic Scripts</DropdownMenuLabel>
            {INDIC_SCRIPTS.map(scriptKey => (
              <DropdownMenuItem key={scriptKey} onSelect={() => setTargetScript(scriptKey)}>
                {SCRIPT_DEFINITIONS[scriptKey].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuGroup>
             <DropdownMenuLabel>Roman Phonetic</DropdownMenuLabel>
            {ROMAN_SCRIPTS.map(scriptKey => (
              <DropdownMenuItem key={scriptKey} onSelect={() => setTargetScript(scriptKey)}>
                {SCRIPT_DEFINITIONS[scriptKey].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

export function LanguageSwitcher() {
  // This component can be built out later
  return null;
}
