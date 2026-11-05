import React from 'react';

interface ShimmerSkeletonProps {
  className?: string;
  /** Aspect ratio for image skeleton */
  aspectRatio?: string;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({ 
  className = '', 
  aspectRatio = 'aspect-video' 
}) => {
  return (
    <div className={`${aspectRatio} ${className} relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg`}>
      <div className="absolute inset-0 shimmer-animation"></div>
      <style>{`
        .shimmer-animation {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};
