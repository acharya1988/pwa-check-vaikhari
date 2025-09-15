
'use client';

import { useState } from 'react';

export function useTabs(defaultTab: string) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return {
    activeTab,
    handleTabChange,
  };
}
