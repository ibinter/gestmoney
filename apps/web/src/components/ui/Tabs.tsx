'use client';
// ============================================================
// COMPOSANT TABS — GESTMONEY
// ============================================================
import React, { useState } from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key ?? '');

  const handleSelect = (key: string) => {
    setActiveTab(key);
    onChange?.(key);
  };

  const currentTab = tabs.find((t) => t.key === activeTab);

  return (
    <div className={clsx('w-full', className)}>
      {/* Barre des onglets */}
      <div className="border-b border-gray-200" role="tablist" aria-label="Onglets">
        <nav className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.key}`}
                id={`tab-${tab.key}`}
                onClick={() => handleSelect(tab.key)}
                className={clsx(
                  'relative px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  isActive
                    ? 'text-sidebar border-b-2 border-primary'
                    : 'text-text-muted hover:text-text-main hover:border-b-2 hover:border-gray-300 border-b-2 border-transparent'
                )}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={clsx(
                      'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold',
                      isActive ? 'bg-primary text-sidebar' : 'bg-gray-200 text-text-muted'
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu de l'onglet actif */}
      {currentTab && (
        <div
          role="tabpanel"
          id={`tabpanel-${currentTab.key}`}
          aria-labelledby={`tab-${currentTab.key}`}
          className="mt-6"
        >
          {currentTab.content}
        </div>
      )}
    </div>
  );
}
