
'use client';

import { useTransliteration, SCRIPT_DEFINITIONS } from '@/components/transliteration-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';

export function ScriptSwitcher() {
  const { targetScript, setTargetScript } = useTransliteration();

  return (
      <Select value={targetScript} onValueChange={setTargetScript}>
        <SelectTrigger id="script-switcher" className="w-[180px] h-9">
          <SelectValue placeholder="Select script" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Indic Scripts</SelectLabel>
            {Object.entries(SCRIPT_DEFINITIONS).filter(([k]) => !['IAST', 'ITRANS', 'HK', 'SLP1'].includes(k)).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
             <SelectLabel>Roman Phonetic</SelectLabel>
            {Object.entries(SCRIPT_DEFINITIONS).filter(([k]) => ['IAST', 'ITRANS', 'HK', 'SLP1'].includes(k)).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
  );
}

export function LanguageSwitcher() {
  // This component can be built out later
  return null;
}
