import React, { useMemo } from 'react';
import { SHRELL_LOADER_POINTS } from './shrellLoaderData';

export interface SquareGridLoaderProps {
  color?: string;
  size?: number;
  className?: string;
  /** When true, forces white squares (e.g. inside brand red buttons) */
  white?: boolean;
}

export const SquareGridLoader: React.FC<SquareGridLoaderProps> = ({
  color,
  size = 48,
  className = '',
  white = false,
}) => {
  // If white is explicitly requested or color is white, use crisp white.
  // Otherwise use the passed color or default to signature crimson red (#FF000E).
  const fillColor = white || color === '#ffffff' || color === 'white' ? '#FFFFFF' : (color || '#FF000E');

  // Pre-calculate deterministic staggered delays for each of the 1,184 raster blocks
  const blocks = useMemo(() => {
    return SHRELL_LOADER_POINTS.map(([r, c]) => {
      // Deterministic hash to give natural pseudo-random distribution between 0 and 1100ms
      const delay = Math.abs(((r * 48 + c) * 73) % 1100);
      return { r, c, delay };
    });
  }, []);

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none ${className}`}
      role="img"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
      }}
    >
      <style>
        {`@keyframes loader_5191 { from { opacity: .3; } to { opacity: 1; } }`}
      </style>
      {blocks.map(({ r, c, delay }) => (
        <rect
          key={`${r}-${c}`}
          x={c + 0.07}
          y={r + 0.07}
          width={0.86}
          height={0.86}
          fill={fillColor}
          style={{
            animation: `loader_5191 550ms ease-in-out -${delay}ms infinite alternate`,
          }}
        />
      ))}
    </svg>
  );
};

export default SquareGridLoader;
