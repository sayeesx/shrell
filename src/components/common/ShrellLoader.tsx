import React from 'react';
import { SquareGridLoader } from './SquareGridLoader';

export interface ShrellLoaderProps {
  size?: number;
  /** Override color for the grid squares */
  color?: string;
  className?: string;
  fullPage?: boolean;
  /** When true, forces white squares (use on red/colored/dark button backgrounds) */
  white?: boolean;
}

export const ShrellLoader: React.FC<ShrellLoaderProps> = ({
  size = 50,
  color,
  className = '',
  fullPage = false,
  white = false,
}) => {
  const squareColor = white ? '#ffffff' : color || '#FF000E';

  const content = (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      role="status"
      aria-label="Loading"
    >
      <SquareGridLoader size={size} color={squareColor} />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
};
