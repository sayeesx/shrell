import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

export interface CategoryItem {
  id: string;
  slug?: string;
  label: string;
  iconSrc: string;
  to: string;
}

export const CATEGORY_ITEMS: CategoryItem[] = [
  { id: 'all', slug: '', label: 'All', iconSrc: '/icons/all.svg', to: '/catalogue' },
  { id: 'interior', slug: 'car-interior', label: 'Car Interior', iconSrc: '/icons/floormats.svg', to: '/catalogue?category=car-interior' },
  { id: 'exterior', slug: 'car-exterior', label: 'Car Exterior', iconSrc: '/icons/carcare.svg', to: '/catalogue?category=car-exterior' },
  { id: 'microfiber', slug: 'microfiber-cloths', label: 'Microfiber Cloths', iconSrc: '/icons/wash.svg', to: '/catalogue?category=microfiber-cloths' },
  { id: 'kits', slug: 'kits-and-combos', label: 'Kits and Combos', iconSrc: '/icons/tools.svg', to: '/catalogue?category=kits-and-combos' },
  { id: 'perfumes', slug: 'car-perfumes', label: 'Car Perfumes', iconSrc: '/icons/freshner.svg', to: '/catalogue?category=car-perfumes' },
];

interface CategoryCircleStripProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export const CategoryCircleStrip: React.FC<CategoryCircleStripProps> = ({
  activeId,
  onSelect,
  className = '',
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentCategorySlug = (searchParams.get('category') || '').toLowerCase();

  // Determine which category is active:
  // 1. Explicit prop if provided
  // 2. Matching search param on catalogue page
  // 3. 'all' if on /catalogue with no category
  // 4. Fallback to 'all'
  let resolvedActiveId = activeId;
  if (!resolvedActiveId) {
    if (location.pathname === '/catalogue') {
      if (!currentCategorySlug) {
        resolvedActiveId = 'all';
      } else {
        const match = CATEGORY_ITEMS.find(
          (c) =>
            c.slug === currentCategorySlug ||
            c.id === currentCategorySlug ||
            (c.slug && currentCategorySlug.includes(c.slug)) ||
            (c.slug && c.slug.includes(currentCategorySlug))
        );
        resolvedActiveId = match ? match.id : 'all';
      }
    } else {
      resolvedActiveId = 'all';
    }
  }

  return (
    <nav
      aria-label="Product Categories Navigation"
      className={`overflow-x-auto no-scrollbar pt-2 pb-3 select-none ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex items-center gap-6 sm:gap-8 min-w-max justify-start md:justify-center px-2">
        {CATEGORY_ITEMS.map((cat) => {
          const isActive = resolvedActiveId === cat.id;
          return (
            <Link
              key={cat.id}
              to={cat.to}
              onClick={() => onSelect?.(cat.id)}
              className="flex flex-col items-center gap-2 group min-w-[72px] sm:min-w-[88px] relative pb-2.5 transition-all focus:outline-none"
            >
              <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] flex items-center justify-center transition-all">
                <img
                  src={cat.iconSrc}
                  alt=""
                  aria-hidden="true"
                  className={`w-full h-full object-contain pointer-events-none opacity-100 ${
                    isActive ? 'drop-shadow-[0_0_12px_rgba(255,0,14,0.5)]' : ''
                  }`}
                  loading="eager"
                />
              </div>
              <span
                className={`text-[12px] sm:text-[13px] font-medium tracking-tight text-center whitespace-nowrap transition-colors ${
                  isActive ? 'text-[#FF000E] font-semibold' : 'text-gray-400 group-hover:text-gray-200'
                }`}
              >
                {cat.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-[#FF000E] rounded-full transition-all" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
