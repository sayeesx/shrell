import React from 'react';

interface ShimmerSkeletonProps {
  type?: 'banner' | 'product' | 'text' | 'card';
  className?: string;
  height?: string;
  width?: string;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  type = 'text',
  className = '',
  height,
  width,
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer';
  
  switch (type) {
    case 'banner':
      return (
        <div 
          className={`rounded-lg overflow-hidden ${height || 'h-[180px] sm:h-[260px] md:h-[480px]'} ${width || 'w-full'} ${baseClasses} ${className}`}
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(229, 231, 235, 1) 0%, rgba(209, 213, 219, 1) 50%, rgba(229, 231, 235, 1) 100%)',
            animation: 'shimmer 1.5s infinite linear'
          }}
        />
      );
    
    case 'product':
      return (
        <div className={`rounded-xl overflow-hidden ${className}`}>
          <div className={`${height || 'aspect-square'} ${width || 'w-full'} ${baseClasses}`} />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <div className="h-2 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <div className="flex justify-between pt-2">
              <div className="h-3 w-1/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
              <div className="h-6 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            </div>
          </div>
        </div>
      );
    
    case 'card':
      return (
        <div className={`rounded-2xl overflow-hidden ${height || 'h-40'} ${width || 'w-full'} ${baseClasses} ${className}`} />
      );
    
    default: // text
      return (
        <div className={`${height || 'h-4'} ${width || 'w-full'} ${baseClasses} rounded ${className}`} />
      );
  }
};

// Add CSS animation to global styles
export const ShimmerSkeletonStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    
    .animate-shimmer {
      animation: shimmer 1.5s infinite linear;
    }
  `}</style>
);