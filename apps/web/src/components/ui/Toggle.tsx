'use client';
// ============================================================
// COMPOSANT TOGGLE — GESTMONEY
// ============================================================
import React from 'react';
import { clsx } from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, id }: ToggleProps) {
  const toggleId = id ?? `toggle-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <label
      htmlFor={toggleId}
      className={clsx(
        'inline-flex items-center gap-3',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <div className="relative">
        <input
          id={toggleId}
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-checked={checked}
          aria-disabled={disabled}
        />
        {/* Track */}
        <div
          className={clsx(
            'w-11 h-6 rounded-full transition-colors duration-200 ease-in-out',
            checked ? 'bg-primary' : 'bg-gray-300'
          )}
        />
        {/* Thumb */}
        <div
          className={clsx(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm',
            'transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
      {label && (
        <span className="text-sm text-text-main select-none">{label}</span>
      )}
    </label>
  );
}
