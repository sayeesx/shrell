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
      className={`flex items-center justify-center w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer ${
        isDark
          ? 'bg-[#130E10] hover:bg-[#1D1214] text-yellow-400'
          : 'bg-[#EDE9E1] hover:bg-[#E0DBD2] text-gray-700'
      } ${className}`}
    >
      <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'} text-sm sm:text-base leading-none`} aria-hidden="true" />
    </button>
  );
};
