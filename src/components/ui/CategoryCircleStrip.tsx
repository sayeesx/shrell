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
  { id: 'wash', slug: 'wash', label: 'Car Wash', iconSrc: '/icons/wash.svg', to: '/catalogue?category=wash' },
  { id: 'charger', slug: 'charging-power', label: 'Chargers', iconSrc: '/icons/charger.svg', to: '/catalogue?category=charging-power' },
  { id: 'freshner', slug: 'air-fresheners', label: 'Air Freshener', iconSrc: '/icons/freshner.svg', to: '/catalogue?category=air-fresheners' },
  { id: 'lighting', slug: 'auxiliary-lighting', label: 'Lighting', iconSrc: '/icons/light.svg', to: '/catalogue?category=auxiliary-lighting' },
  { id: 'mats', slug: 'all-weather-floor-protection', label: 'Floor Mats', iconSrc: '/icons/floormats.svg', to: '/catalogue?category=all-weather-floor-protection' },
  { id: 'dashcam', slug: 'dash-cameras', label: 'Dash Cams', iconSrc: '/icons/dashcam.svg', to: '/catalogue?category=dash-cameras' },
  { id: 'tyre', slug: 'tyre-care-air-systems', label: 'Tyre Care', iconSrc: '/icons/tyre-care.svg', to: '/catalogue?category=tyre-care-air-systems' },
  { id: 'tools', slug: 'touring-recovery-gear', label: 'Recovery', iconSrc: '/icons/tools.svg', to: '/catalogue?category=touring-recovery-gear' },
  { id: 'audio', slug: 'audio', label: 'Audio & Tech', iconSrc: '/icons/audio-screen.svg', to: '/catalogue?category=audio' },
  { id: 'cleaning', slug: 'car-care', label: 'Car Care', iconSrc: '/icons/carcare.svg', to: '/catalogue?category=car-care' },
  { id: 'coolant', slug: 'cooling-systems', label: 'Cooling', iconSrc: '/icons/coolant.svg', to: '/catalogue?category=cooling-systems' },
  { id: 'others', slug: 'others', label: 'Others', iconSrc: '/icons/others.svg', to: '/catalogue?category=others' },
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
      className={`overflow-x-auto no-scrollbar pt-1 pb-2 select-none ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex items-center gap-5 sm:gap-7 min-w-max justify-start md:justify-center px-1">
        {CATEGORY_ITEMS.map((cat) => {
          const isActive = resolvedActiveId === cat.id;
          return (
            <Link
              key={cat.id}
              to={cat.to}
              onClick={() => onSelect?.(cat.id)}
              className="flex flex-col items-center gap-1.5 group min-w-[58px] sm:min-w-[68px] relative pb-2 transition-all focus:outline-none"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-all">
                <img
                  src={cat.iconSrc}
                  alt=""
                  aria-hidden="true"
                  className={`w-full h-full object-contain pointer-events-none transition-opacity ${
                    isActive
                      ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,0,14,0.45)]'
                      : 'opacity-75 group-hover:opacity-100'
                  }`}
                  loading="eager"
                />
              </div>
              <span
                className={`text-[11px] sm:text-[12px] font-medium tracking-tight text-center whitespace-nowrap transition-colors ${
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
