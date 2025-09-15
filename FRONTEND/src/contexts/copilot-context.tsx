
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CopilotContextType {
  isCopilotOpen: boolean;
  setCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  contextText: string | null;
  openCopilotWithContext: (text: string) => void;
  clearCopilotContext: () => void;
  isMobile: boolean | undefined;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isCopilotOpen, setCopilotOpen] = useState(false);
  const [contextText, setContextText] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const openCopilotWithContext = useCallback((text: string) => {
    setContextText(text);
    setCopilotOpen(true);
  }, []);
  
  const clearCopilotContext = useCallback(() => {
    setContextText(null);
  }, []);

  return (
    <CopilotContext.Provider value={{ isCopilotOpen, setCopilotOpen, contextText, openCopilotWithContext, clearCopilotContext, isMobile }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (context === undefined) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
}
