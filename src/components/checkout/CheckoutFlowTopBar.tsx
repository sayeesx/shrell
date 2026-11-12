import React from 'react';
import { useTheme } from '../../application/ThemeContext';

export interface CheckoutFlowTopBarProps {
  title: string;
  onBack: () => void;
  backLabel?: string;
  rightSlot?: React.ReactNode;
}

/**
 * Shared top navigation bar for Cart, Checkout, and Order result pages.
 * Keeps the back button and centered title locked to identical screen coordinates across steps.
 */
export const CheckoutFlowTopBar: React.FC<CheckoutFlowTopBarProps> = ({
  title,
  onBack,
  backLabel = 'Go back',
  rightSlot,
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`w-full border-b shrink-0 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className={`absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF000E] ${
            isDark
              ? 'bg-[#130E10] border-[#261619] text-[#F1EEEE] hover:bg-[#1C1416]'
              : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10] hover:bg-[#EDE9E1]'
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 block"
            aria-hidden="true"
          >
            <path d="M10.2 3.2L5.4 8L10.2 12.8" />
          </svg>
        </button>

        <h1 className="text-base sm:text-lg font-bold tracking-tight text-center truncate px-12">
          {title}
        </h1>

        {rightSlot && (
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
};
