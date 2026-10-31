import React from 'react';

interface ProductImagePlaceholderProps {
  className?: string;
  alt?: string;
  showBadge?: boolean;
}

export const ProductImagePlaceholder: React.FC<ProductImagePlaceholderProps> = ({
  className = '',
  alt = 'SHRELL Automotive Product Placeholder',
  showBadge = true,
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-6 bg-[#0D0F14] select-none relative overflow-hidden ${className}`}
      aria-label={alt}
    >
      {/* Subtle background mesh or gradient glow */}
      <div className="absolute inset-0 bg-radial from-surface-800/20 via-transparent to-transparent pointer-events-none" />

      {/* SHRELL Reduced-Opacity Grey Brand Logo */}
      <img
        src="/logos/shrell-full_white-text_black-logo.png"
        alt={alt}
        className="max-w-[70%] max-h-[60%] w-auto h-auto object-contain opacity-25 grayscale brightness-125 transition-opacity duration-300 pointer-events-none"
        loading="lazy"
      />

      {/* Subtle Indicator Label */}
      {showBadge && (
        <span className="mt-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase opacity-60 select-none">
          Image In Production
        </span>
      )}
    </div>
  );
};
