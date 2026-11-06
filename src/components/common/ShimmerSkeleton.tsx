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
    <div className={`${aspectRatio} ${className} relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg`} />
  );
};
