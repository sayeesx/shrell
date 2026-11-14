import React from 'react';
import { useTheme } from '../../application/ThemeContext';

export const ShimmerSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`shimmer-box rounded-lg ${className}`} />
);

/**
 * Exact replica of the Home Screen Hero Banner (Desktop & Mobile aspects)
 * Matches HomePage.tsx container padding and aspect ratio constraints.
 */
export const HomeBannerSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <section className="pt-1 sm:pt-1 pb-[0.3cm] sm:pb-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative rounded-lg overflow-hidden bg-transparent flex items-center justify-center w-full max-h-[180px] sm:max-h-[260px] md:max-h-[480px] lg:max-h-[560px] xl:max-h-[620px]">
          {/* Desktop Aspect */}
          <div
            className={`hidden md:block w-full h-[260px] lg:h-[340px] xl:h-[400px] rounded-lg border shimmer-box ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`}
          />
          {/* Mobile Aspect */}
          <div
            className={`block md:hidden w-full h-[160px] sm:h-[180px] rounded-lg border shimmer-box ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`}
          />
        </div>
      </div>
    </section>
  );
};

/**
 * Category Chips / Badges Skeleton Row (used in CataloguePage)
 */
export const CategoryRowSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div
          key={idx}
          className={`h-8 shrink-0 rounded-full border px-4 flex items-center shimmer-box ${
            isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
          }`}
          style={{ width: `${72 + (idx % 3) * 24}px` }}
        />
      ))}
    </div>
  );
};

/**
 * Exact replica of ProductCard layout (rounded-xl, full-bleed border-b image, badges, metadata, price + quick add)
 */
export const ProductCardSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <article
      className={`border rounded-xl overflow-hidden flex flex-col ${
        isDark
          ? 'bg-[#0A0808] border-[#221215]'
          : 'bg-white border-[#E0DBD2]'
      }`}
    >
      {/* Product Image Frame (Matches ProductCard.tsx aspect ratio & full-bleed border-b) */}
      <div
        className={`relative aspect-square sm:aspect-[4/3] border-b overflow-hidden ${
          isDark ? 'bg-[#080000] border-[#221215]' : 'bg-[#FFFEFA] border-[#E0DBD2]'
        }`}
      >
        <div className="w-full h-full shimmer-box" />

        {/* Top-Right Wishlist Button Skeleton */}
        <div
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-md border shimmer-box ${
            isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
          }`}
        />

        {/* Bottom Image Overlay Offers Badge Skeleton */}
        <div className="absolute bottom-2 left-2 z-10">
          <div
            className={`h-4 sm:h-5 w-20 sm:w-24 rounded border shimmer-box ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`}
          />
        </div>
      </div>

      {/* Body Metadata (Title 2-line placeholder + Price & Action Row) */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="min-h-[2.2rem] sm:min-h-[2.5rem] space-y-1.5">
            <div className="h-3.5 sm:h-4 w-5/6 rounded shimmer-box" />
            <div className="h-3.5 sm:h-4 w-3/5 rounded shimmer-box" />
          </div>
        </div>

        {/* Pricing and Action Row */}
        <div
          className={`mt-2 pt-2 border-t flex items-center justify-between gap-1.5 ${
            isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'
          }`}
        >
          {/* Price Stack */}
          <div className="min-w-0 space-y-1">
            <div className="h-4 sm:h-5 w-16 sm:w-20 rounded shimmer-box" />
          </div>

          {/* Quick Add Button Skeleton (Matches min-h-[32px] sm:min-h-[34px] w-[70px] sm:w-[80px]) */}
          <div className="h-8 sm:h-[34px] w-[70px] sm:w-[80px] rounded-lg shimmer-box shrink-0" />
        </div>
      </div>
    </article>
  );
};

/**
 * Full HomePage Dynamic Shimmer Skeleton Layout
 * Matches real HomePage sections structure (Banner -> Active Sections with headers and 4-column product grids)
 */
export const HomePageSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-1 sm:space-y-10 pb-20 animate-in fade-in duration-200">
      {/* 1. Hero Banner Skeleton */}
      <HomeBannerSkeleton />

      {/* 2. Active Sections Content Zone */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 pt-0 sm:pt-2">
        {/* Section 1: Crazy Finds */}
        <section className="space-y-4 sm:space-y-5">
          <div
            className={`flex items-center justify-between border-b pb-2.5 sm:pb-3 gap-3 ${
              isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'
            }`}
          >
            <div className="min-w-0 space-y-1.5">
              <div className="h-6 sm:h-7 w-36 sm:w-48 rounded-md shimmer-box" />
              <div className="h-3 sm:h-3.5 w-48 sm:w-64 rounded-md shimmer-box" />
            </div>
            <div className="h-4 w-16 rounded shimmer-box shrink-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        </section>

        {/* Section 2: Deals & Highlights */}
        <section className="space-y-4 sm:space-y-5">
          <div
            className={`flex items-center justify-between border-b pb-2.5 sm:pb-3 gap-3 ${
              isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'
            }`}
          >
            <div className="min-w-0 space-y-1.5">
              <div className="h-6 sm:h-7 w-40 sm:w-52 rounded-md shimmer-box" />
              <div className="h-3 sm:h-3.5 w-52 sm:w-72 rounded-md shimmer-box" />
            </div>
            <div className="h-4 w-16 rounded shimmer-box shrink-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

/**
 * Exact replica of ProductDetailPage Layout
 * Matches container max-width (max-w-2xl lg:max-w-5xl), 2-column grid, free-floating image, thumb cubes, and details.
 */
export const ProductDetailSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
      }`}
    >
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-36 sm:pb-16 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* LEFT: Product Image Showcase */}
          <div className="space-y-4">
            {/* Main Product Image Skeleton (matches free-floating max-h-72 aspect-square sm:aspect-[4/3]) */}
            <div className="relative aspect-square sm:aspect-[4/3] flex items-center justify-center p-4 sm:p-8 select-none">
              <div
                className={`w-full h-full max-h-72 rounded-2xl border shimmer-box ${
                  isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
                }`}
              />
            </div>

            {/* 4 Small Selectable Image Cubes (matches w-14 h-14 sm:w-16 sm:h-16 rounded-lg) */}
            <div className="flex items-center gap-3 pt-1">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border shimmer-box ${
                    isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Buy Box */}
          <div className="space-y-4 sm:space-y-5">
            {/* Title & Share Button */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-7 sm:h-8 w-5/6 rounded shimmer-box" />
                  <div className="h-7 sm:h-8 w-3/5 rounded shimmer-box" />
                </div>
                <div className="h-8 w-20 rounded-lg shimmer-box shrink-0" />
              </div>

              {/* Rating stars row */}
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-24 rounded shimmer-box" />
                <div className="h-4 w-16 rounded shimmer-box" />
              </div>
            </div>

            {/* Price Box */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#0E0A0B] border-[#221215]' : 'bg-[#F9F8F6] border-[#E0DBD2]'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <div className="h-8 w-32 rounded shimmer-box" />
                <div className="h-4 w-16 rounded shimmer-box" />
              </div>
              <div className="h-3 w-44 rounded shimmer-box" />
            </div>

            {/* Vehicle Fitment Box */}
            <div
              className={`h-20 rounded-xl border shimmer-box ${
                isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
              }`}
            />

            {/* Action Buttons (Add to Cart / Buy Now) */}
            <div className="space-y-2.5 pt-1">
              <div className="h-11 sm:h-12 w-full rounded-xl shimmer-box" />
              <div className="h-11 sm:h-12 w-full rounded-xl shimmer-box" />
            </div>

            {/* Secure Checkout Trust Badge Skeleton */}
            <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
              <div className="h-3 w-32 mx-auto rounded shimmer-box" />
              <div className="h-7 w-64 mx-auto rounded shimmer-box" />
            </div>

            {/* Accordion Skeletons */}
            <div className={`pt-4 border-t space-y-3 ${isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'}`}>
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
 * Exact replica of Customer Orders Skeleton in ProfilePage / OrdersPage
 */
export const ProfileOrdersSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
          key={idx}
          className={`rounded-2xl border p-4 sm:p-6 space-y-4 ${
            isDark ? 'bg-[#120E0F] border-[#261619]' : 'bg-white border-[#E0DBD2] shadow-xs'
          }`}
        >
          {/* Header Row */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 rounded shimmer-box" />
                <div className="h-5 w-20 rounded-full shimmer-box" />
              </div>
              <div className="h-3 w-36 rounded shimmer-box" />
            </div>
            <div className="space-y-1 text-right">
              <div className="h-3 w-16 ml-auto rounded shimmer-box" />
              <div className="h-5 w-24 ml-auto rounded shimmer-box" />
            </div>
          </div>

          {/* Item Row */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className={`w-14 h-14 rounded-xl border shimmer-box shrink-0 ${
                  isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
                }`}
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-3/5 rounded shimmer-box" />
                <div className="h-3 w-28 rounded shimmer-box" />
              </div>
            </div>
            <div className="h-4 w-16 rounded shimmer-box shrink-0" />
          </div>

          {/* Footer Actions Row */}
          <div
            className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2.5 ${
              isDark ? 'border-[#261619]' : 'border-[#E0DBD2]'
            }`}
          >
            <div className="h-4 w-32 rounded shimmer-box" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 rounded-lg shimmer-box" />
              <div className="h-8 w-28 rounded-lg shimmer-box" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
