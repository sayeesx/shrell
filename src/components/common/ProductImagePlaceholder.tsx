import React from 'react';

interface ProductImagePlaceholderProps {
  className?: string;
  alt?: string;
  showBadge?: boolean;
}

export const ProductImagePlaceholder: React.FC<ProductImagePlaceholderProps> = ({
  className = '',
  alt = 'SHRELL Automotive Product',
  showBadge = false,
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-6 bg-[#0A0808] bg-gradient-to-b from-[#130E10]/80 to-[#0A0808] select-none relative overflow-hidden ${className}`}
      aria-label={alt}
    >
      {/* Subtle atmospheric crimson radial center glow */}
      <div className="absolute inset-0 bg-radial from-[#650008]/15 via-transparent to-transparent pointer-events-none" />

      {/* SHRELL Reduced-Opacity Grey Brand Logo */}
      <img
        src="/logos/shrell-full_white-text_black-logo.png"
        alt={alt}
        className="max-w-[70%] max-h-[55%] w-auto h-auto object-contain opacity-30 grayscale brightness-125 transition-all duration-300 pointer-events-none group-hover:scale-105 group-hover:opacity-40"
        loading="lazy"
      />

      {/* Optional subtle badge */}
      {showBadge && (
        <span className="mt-3 text-[9px] font-sans tracking-widest text-[#8E8587] uppercase opacity-70 select-none">
          SHRELL Official
        </span>
      )}
    </div>
  );
};
