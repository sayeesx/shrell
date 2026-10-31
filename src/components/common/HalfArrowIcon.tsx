import React from 'react';

interface HalfArrowIconProps {
  className?: string;
  strokeWidth?: number | string;
}

/**
 * Sleek Half-Arrow (Left Chevron) icon
 * Elegant, standard modern back navigation affordance.
 */
export const HalfArrowIcon: React.FC<HalfArrowIconProps> = ({
  className = 'w-4 h-4',
  strokeWidth = 2.4,
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
};
