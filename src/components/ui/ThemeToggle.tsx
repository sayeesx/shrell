import React from 'react';
import { useTheme } from '../../application/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer active:scale-95 ${
        isDark
          ? 'bg-[#130E10] hover:bg-[#1A1214] border-[#261619] text-white hover:text-white'
          : 'bg-[#EDE9E1] hover:bg-[#E0DBD2] border-[#D6D0C7] text-gray-700'
      } ${className}`}
    >
      <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'} text-base leading-none`} aria-hidden="true" />
    </button>
  );
};
