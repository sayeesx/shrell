import React from 'react';

interface HalfArrowIconProps {
  className?: string;
  strokeWidth?: number | string;
}

/**
 * Minimalist Half-Arrow icon (stem with single top barb)
 * for a sleek, modern back navigation affordance.
 */
export const HalfArrowIcon: React.FC<HalfArrowIconProps> = ({
  className = 'w-4 h-4',
  strokeWidth = 2.2,
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M12 5L5 12" />
    </svg>
  );
};
