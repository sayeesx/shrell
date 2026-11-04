import React from 'react';
import { useTheme } from '../../application/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  /** compact: icon-only button; default: icon + label */
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', compact = false }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`flex items-center gap-1.5 rounded-full transition-colors cursor-pointer select-none
        ${isDark
          ? 'bg-[#130E10] hover:bg-[#1D1214] border border-[#221215] text-slate-300 hover:text-white'
          : 'bg-[#EDE9E1] hover:bg-[#E0DBD2] border border-[#D6D0C7] text-[#3A3030] hover:text-[#140E10]'}
        px-2.5 py-1.5 text-xs font-medium ${className}`}
    >
      <i className={`bi ${isDark ? 'bi-moon' : 'bi-moon-stars'} text-sm leading-none`} aria-hidden="true" />
      {!compact && (
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
};
