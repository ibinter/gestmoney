'use client';
// ============================================================
// COMPOSANTS INPUT & SELECT — GESTMONEY
// ============================================================
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erreur?: string;
  icone?: React.ReactNode;
  iconePosition?: 'gauche' | 'droite';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, erreur, icone, iconePosition = 'gauche', className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="relative">
          {icone && iconePosition === 'gauche' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icone}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-xl border bg-white text-text-main placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all duration-150 text-sm',
              'py-2.5',
              icone && iconePosition === 'gauche' ? 'pl-10 pr-4' : 'px-4',
              icone && iconePosition === 'droite' ? 'pr-10' : '',
              erreur ? 'border-danger' : 'border-gray-200 hover:border-gray-300',
              className
            )}
            {...props}
          />
          {icone && iconePosition === 'droite' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {icone}
            </div>
          )}
        </div>
        {erreur && <p className="text-xs text-danger">{erreur}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  erreur?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, erreur, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <select
          ref={ref}
          className={clsx(
            'w-full rounded-xl border bg-white text-text-main px-4 py-2.5 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-all duration-150 appearance-none',
            erreur ? 'border-danger' : 'border-gray-200 hover:border-gray-300',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {erreur && <p className="text-xs text-danger">{erreur}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
