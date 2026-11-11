import React from 'react';
import { useTheme } from '../../application/ThemeContext';

export const ShimmerSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`shimmer-box rounded-lg ${className}`} />
);

/**
 * Exact replica of the Home Screen Hero Banner (Desktop & Mobile aspects)
 */
export const HomeBannerSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-2 pb-0 sm:pb-4">
      {/* Mobile Aspect Banner Skeleton */}
      <div className="block sm:hidden w-full">
        <div className={`w-full aspect-[16/9] max-h-[190px] rounded-2xl border shimmer-box ${
          isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
        }`} />
      </div>

      {/* Desktop Aspect Banner Skeleton */}
      <div className="hidden sm:block w-full">
        <div className={`w-full aspect-[16/5] max-h-[380px] rounded-2xl border shimmer-box ${
          isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
        }`} />
      </div>
    </div>
  );
};

/**
 * Category Chips / Badges Skeleton Row
 */
export const CategoryRowSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className={`h-9 shrink-0 rounded-full border px-4 flex items-center gap-2 shimmer-box ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`}
            style={{ width: `${80 + (idx % 3) * 28}px` }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Exact replica of ProductCard layout
 */
export const ProductCardSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 flex flex-col justify-between space-y-3 ${
      isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-white border-[#E0DBD2]'
    }`}>
      {/* Product Image Skeleton */}
      <div className={`aspect-square w-full rounded-xl shimmer-box border ${
        isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
      }`} />

      {/* Details Skeleton */}
      <div className="space-y-2 flex-1">
        <div className="h-3 w-1/3 rounded shimmer-box" />
        <div className="h-4 w-5/6 rounded shimmer-box" />
        <div className="h-4 w-3/5 rounded shimmer-box" />
        <div className="flex items-center gap-2 pt-1">
          <div className="h-5 w-24 rounded shimmer-box" />
          <div className="h-4 w-12 rounded shimmer-box" />
        </div>
      </div>

      {/* Action Button Skeleton */}
      <div className="h-9 w-full rounded-xl shimmer-box mt-2" />
    </div>
  );
};

/**
 * Full HomePage Dynamic Shimmer Skeleton Layout
 */
export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 sm:space-y-12 pb-20 animate-in fade-in duration-300">
      {/* 1. Hero Banner Skeleton */}
      <HomeBannerSkeleton />

      {/* 2. Categories Skeleton */}
      <CategoryRowSkeleton />

      {/* 3. Section 1 (Crazy Finds / Feature Section) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-6 w-44 rounded-md shimmer-box" />
            <div className="h-3.5 w-64 rounded-md shimmer-box" />
          </div>
          <div className="h-4 w-16 rounded shimmer-box" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </div>

      {/* 4. Section 2 (Deals Grid) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-6 w-48 rounded-md shimmer-box" />
            <div className="h-3.5 w-72 rounded-md shimmer-box" />
          </div>
          <div className="h-4 w-16 rounded shimmer-box" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Exact replica of ProductDetailPage Layout
 */
export const ProductDetailSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 ${
      isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-52 rounded shimmer-box mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Gallery (6 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className={`aspect-square max-h-[480px] w-full rounded-2xl border shimmer-box ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`} />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl border shimmer-box ${
                    isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Details & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Category badge */}
            <div className="h-4 w-28 rounded shimmer-box" />

            {/* Title */}
            <div className="space-y-2">
              <div className="h-7 w-5/6 rounded shimmer-box" />
              <div className="h-7 w-2/3 rounded shimmer-box" />
            </div>

            {/* Rating Stars row */}
            <div className="flex items-center gap-3">
              <div className="h-4 w-28 rounded shimmer-box" />
              <div className="h-4 w-20 rounded shimmer-box" />
            </div>

            {/* Price Box */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-32 rounded shimmer-box" />
                <div className="h-5 w-20 rounded shimmer-box" />
              </div>
              <div className="h-3 w-40 rounded shimmer-box" />
            </div>

            {/* Vehicle Fitment Box */}
            <div className={`h-16 rounded-xl border shimmer-box ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`} />

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <div className="h-12 w-full rounded-xl shimmer-box" />
              <div className="h-12 w-full rounded-xl shimmer-box" />
            </div>

            {/* Accordion Skeletons */}
            <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
              <div className="h-10 w-full rounded-lg shimmer-box" />
              <div className="h-10 w-full rounded-lg shimmer-box" />
              <div className="h-10 w-full rounded-lg shimmer-box" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Exact replica of Customer Orders Skeleton in ProfilePage
 */
export const ProfileOrdersSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
          key={idx}
          className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
            isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-white border-[#E0DBD2]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded shimmer-box" />
            <div className="h-6 w-20 rounded-full shimmer-box" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className={`w-14 h-14 rounded-lg shimmer-box border ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`} />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-3/4 rounded shimmer-box" />
              <div className="h-3 w-1/3 rounded shimmer-box" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
            <div className="h-4 w-28 rounded shimmer-box" />
            <div className="h-7 w-24 rounded-lg shimmer-box" />
          </div>
        </div>
      ))}
    </div>
  );
};
