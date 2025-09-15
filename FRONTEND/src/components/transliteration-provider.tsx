
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useLayoutEffect, useRef } from 'react';
// @ts-ignore
import * as Sanscript from '@sanskrit-coders/sanscript';
const SanscriptAny: any = Sanscript;

// Map user-friendly names to library scheme names, now with proper labels
export const SCRIPT_DEFINITIONS: { [key: string]: { scheme: string; label: string } } = {
  'DEVANAGARI': { scheme: 'devanagari', label: 'Devanagari' },
  'KANNADA':    { scheme: 'kannada', label: 'Kannada' },
  'TELUGU':     { scheme: 'telugu', label: 'Telugu' },
  'TAMIL':      { scheme: 'tamil', label: 'Tamil' },
  'MALAYALAM':  { scheme: 'malayalam', label: 'Malayalam' },
  'GUJARATI':   { scheme: 'gujarati', label: 'Gujarati' },
  'BENGALI':    { scheme: 'bengali', label: 'Bengali' },
  'GURMUKHI':   { scheme: 'gurmukhi', label: 'Gurmukhi' },
  'IAST':       { scheme: 'iast', label: 'IAST (Diacritical)' },
  'ITRANS':     { scheme: 'itrans', label: 'ITRANS (Phonetic)' },
  'HK':         { scheme: 'hk', label: 'Harvard-Kyoto' },
  'SLP1':       { scheme: 'slp1', label: 'SLP1' },
};

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'ne', name: 'Nepali' },
    { code: 'bo', name: 'Tibetan' },
];


export const AVAILABLE_SCRIPT_KEYS = Object.keys(SCRIPT_DEFINITIONS);

interface TransliterationContextType {
  targetScript: string;
  setTargetScript: (script: string) => void;
  transliterate: (text: string, fromScript?: string) => string;
}

const TransliterationContext = createContext<TransliterationContextType | undefined>(undefined);

interface LanguageContextType {
  targetLang: string;
  setTargetLang: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);


/**
 * Post-processes transliterated text for specific Indic scripts to match modern
 * orthographic conventions, primarily handling the anusvara rule where a class
 * nasal before a consonant of the same class is replaced by an anusvara.
 * @param text The transliterated text from the sanscript library.
 * @param script The target script key (e.g., 'KANNADA').
 * @returns The corrected text.
 */
function applyOrthographicFixes(text: string, script: string): string {
  let result = text;
  // This rule replaces a class nasal + virama with an anusvara when it precedes
  // a stop consonant of the same class. This reflects modern writing conventions
  // in many Indic scripts.
  switch (script) {
    case 'KANNADA':
      result = result.replace(/ಙ್(?=[ಕಖಗಘ])/g, 'ಂ'); // Velar
      result = result.replace(/ಞ್(?=[ಚಛಜಝ])/g, 'ಂ'); // Palatal
      result = result.replace(/ಣ್(?=[ಟಠಡಢ])/g, 'ಂ'); // Retroflex
      result = result.replace(/ನ್(?=[ತಥದಧ])/g, 'ಂ'); // Dental
      result = result.replace(/ಮ್(?=[ಪಫಬಭ])/g, 'ಂ'); // Labial
      break;
    case 'TELUGU':
      result = result.replace(/ఙ్(?=[కఖగఘ])/g, 'ం');
      result = result.replace(/ಞ్(?=[చఛజఝ])/g, 'ం');
      result = result.replace(/ణ్(?=[టఠడఢ])/g, 'ం');
      result = result.replace(/న్(?=[తథదధ])/g, 'ం');
      result = result.replace(/మ్(?=[పఫబభ])/g, 'ం');
      break;
    case 'GUJARATI':
      result = result.replace(/ઙ્(?=[કખગઘ])/g, 'ં');
      result = result.replace(/ઞ્(?=[ચછજઝ])/g, 'ં');
      result = result.replace(/ણ્(?=[ટઠડઢ])/g, 'ં');
      result = result.replace(/ન્(?=[તથદધ])/g, 'ં');
      result = result.replace(/મ્(?=[પફબભ])/g, 'ં');
      break;
    case 'BENGALI':
      result = result.replace(/ঙ্(?=[কখগঘ])/g, 'ং');
      result = result.replace(/ঞ্(?=[চছজঝ])/g, 'ং');
      result = result.replace(/ণ্(?=[টঠডঢ])/g, 'ং');
      result = result.replace(/ন্(?=[ত্থদধ])/g, 'ং');
      result = result.replace(/ম্(?=[পফবভ])/g, 'ং');
      break;
    case 'GURMUKHI':
      // In Gurmukhi, Bindi (ਂ) is the anusvara equivalent.
      result = result.replace(/ਙ੍(?=[ਕਖਗਘ])/g, 'ਂ');
      result = result.replace(/ਞ੍(?=[ਚਛਜਝ])/g, 'ਂ');
      result = result.replace(/ਣ੍(?=[ਟਠਡਢ])/g, 'ਂ');
      result = result.replace(/ਨ੍(?=[ਤਥਦਧ])/g, 'ਂ');
      result = result.replace(/ਮ੍(?=[ਪਫਬਭ])/g, 'ਂ');
      break;
    case 'MALAYALAM':
      result = result.replace(/ങ്(?=[കഖഗഘ])/g, 'ം');
      result = result.replace(/ஞ்(?=[ചഛജഝ])/g, 'ം');
      result = result.replace(/ണ്(?=[ടഠഡഢ])/g, 'ം');
      result = result.replace(/ന്(?=[തഥദധ])/g, 'ം');
      result = result.replace(/മ്(?=[പഫബഭ])/g, 'ം');
      break;
    case 'TAMIL':
      // Tamil has a more complex orthography. This is an approximation.
      result = result.replace(/ங்(?=[க])/g, 'ஂ');
      result = result.replace(/ஞ்(?=[ச])/g, 'ஂ');
      result = result.replace(/ண்(?=[ட])/g, 'ஂ');
      result = result.replace(/ந்(?=[த])/g, 'ஂ');
      result = result.replace(/ம்(?=[ப])/g, 'ஂ');
      break;
  }
  return result;
}


export function TransliterationProvider({ children }: { children: ReactNode }) {
  const [targetScript, setTargetScriptState] = useState<string>('DEVANAGARI');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedScript = localStorage.getItem('vaikhari-script');
    if (storedScript && SCRIPT_DEFINITIONS[storedScript]) {
      setTargetScriptState(storedScript);
    }
  }, []);

  const setTargetScript = (script: string) => {
    if (SCRIPT_DEFINITIONS[script]) {
      setTargetScriptState(script);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaikhari-script', script);
      }
    }
  };

  const transliterate = React.useCallback((text: string, fromScript = 'devanagari'): string => {
    if (!isMounted || !text) {
      return text;
    }
    try {
      const fromScheme = SCRIPT_DEFINITIONS[fromScript.toUpperCase()]?.scheme || 'devanagari';
      const toScheme = SCRIPT_DEFINITIONS[targetScript]?.scheme || 'devanagari';
      
      if (fromScheme === toScheme) {
          return text;
      }
      
      const transliterated = SanscriptAny.t(text, fromScheme, toScheme);
      return applyOrthographicFixes(transliterated, targetScript);
    } catch (e) {
      console.error('Transliteration failed:', e);
      return text;
    }
  }, [targetScript, isMounted]);

  const value = {
    targetScript,
    setTargetScript,
    transliterate,
  };

  return (
    <TransliterationContext.Provider value={value}>
      {children}
    </TransliterationContext.Provider>
  );
}

export function useTransliteration() {
  const context = useContext(TransliterationContext);
  if (context === undefined) {
    throw new Error('useTransliteration must be used within a TransliterationProvider');
  }
  return context;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [targetLang, setTargetLangState] = useState<string>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedLang = localStorage.getItem('vaikhari-lang');
    if (storedLang && SUPPORTED_LANGUAGES.some(l => l.code === storedLang)) {
      setTargetLangState(storedLang);
    }
  }, []);

  const setTargetLang = (lang: string) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      setTargetLangState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaikhari-lang', lang);
      }
    }
  };

  const value = {
    targetLang,
    setTargetLang,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

const isSanskrit = (text: string): boolean => {
  if (!text) return false;
  // This regex checks for a significant presence of Devanagari characters.
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
};


export const Transliterate = React.memo(({ children }: { children: React.ReactNode }) => {
  const { transliterate, targetScript } = useTransliteration();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const processNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      return isMounted && isSanskrit(node) ? transliterate(node) : node;
    }
    if (React.isValidElement(node) && node.props.children) {
      return React.cloneElement(node, {
        ...node.props,
        children: React.Children.map(node.props.children, processNode),
      });
    }
    return node;
  };

  return <>{React.Children.map(children, processNode)}</>;
});

Transliterate.displayName = 'Transliterate';
