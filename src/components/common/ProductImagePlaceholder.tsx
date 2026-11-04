import React from 'react';
import { useTheme } from '../../application/ThemeContext';

interface ProductImagePlaceholderProps {
  className?: string;
  alt?: string;
  showBadge?: boolean;
  src?: string;
}

export const ProductImagePlaceholder: React.FC<ProductImagePlaceholderProps> = ({
  className = '',
  alt = 'SHRELL Automotive Product',
  showBadge = false,
  src,
}) => {
  const { isDark } = useTheme();
  const [hasError, setHasError] = React.useState(false);

  // Clean and upgrade Cloudinary URL to https to prevent mixed-content blocking in live
  const cleanSrc = React.useMemo(() => {
    if (!src) return '';
    let url = src.trim();
    if (url.startsWith('http://res.cloudinary.com/')) {
      url = url.replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/');
    }
    return url;
  }, [src]);

  const isRealImage = Boolean(
    cleanSrc &&
    !hasError &&
    !cleanSrc.includes('shrell-full_white-text_black-logo.png')
  );

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-2.5 sm:p-3 select-none relative overflow-hidden ${isDark ? 'bg-[#0A0808] bg-gradient-to-b from-[#130E10]/80 to-[#0A0808]' : 'bg-[#F5F3EE] bg-gradient-to-b from-[#EDE9E1]/80 to-[#F5F3EE]'} ${className}`}
      aria-label={alt}
    >
      {/* Subtle atmospheric crimson radial center glow */}
      <div className={`absolute inset-0 bg-radial pointer-events-none ${isDark ? 'from-[#650008]/20 via-transparent to-transparent' : 'from-[#FF000E]/5 via-transparent to-transparent'}`} />

      {isRealImage ? (
        <img
          src={cleanSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain pointer-events-none"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        /* SHRELL Reduced-Opacity Grey Brand Logo Placeholder */
        <img
          src="/logos/shrell-full_white-text_black-logo.png"
          alt={alt}
          className={`w-[88%] h-[78%] max-w-[92%] max-h-[82%] object-contain pointer-events-none ${isDark ? 'opacity-40 grayscale brightness-125' : 'opacity-20 grayscale brightness-50'}`}
          loading="lazy"
        />
      )}

      {/* Optional subtle badge */}
      {showBadge && (
        <span className="mt-3 text-[9px] font-sans tracking-widest text-[#8E8587] uppercase opacity-70 select-none">
          SHRELL Official
        </span>
      )}
    </div>
  );
};
