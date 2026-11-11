import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../../domain/types';
import { productRepository, categoryRepository } from '../../infrastructure/repositories';
import { ProductCard } from '../../components/ui/ProductCard';
import { ProductCardSkeleton } from '../../components/common/ShimmerSkeleton';
import { searchProductsWithFuse } from '../../infrastructure/search/searchService';
import { trackSearchPerformed } from '../../infrastructure/analytics/posthog';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc';

export const CataloguePage: React.FC = () => {
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // Load all products and categories
  useEffect(() => {
    async function loadCatalogue() {
      try {
        setLoading(true);
        const [prodRes, catList] = await Promise.all([
          productRepository.getAll({ limit: 120 }),
          categoryRepository.getAll(),
        ]);
        setProducts(prodRes.products);
        setCategories(catList.filter((c) => c.isActive));
      } catch (err) {
        console.error('Failed to load catalogue data:', err);
      } finally {
        setLoading(false);
        finishPageLoad();
      }
    }
    loadCatalogue();
  }, [finishPageLoad]);

  // Sync state if URL search query changes
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  // Perform Typo-Tolerant Fuse.js fuzzy search
  const filteredProducts = useMemo(() => {
    let pool = products;

    // 1. Category Filter
    if (selectedCategory) {
      pool = pool.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          p.categoryName?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Fuse.js typo-tolerant search
    if (searchInput.trim()) {
      pool = searchProductsWithFuse(pool, searchInput.trim());
    }

    // 3. Sort options
    const sorted = [...pool];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.pricePaisa - b.pricePaisa);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.pricePaisa - a.pricePaisa);
    } else if (sortBy === 'rating-desc') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return sorted;
  }, [products, searchInput, selectedCategory, sortBy]);

  // Track search telemetry on debounced query
  useEffect(() => {
    if (searchInput.trim()) {
      const timer = setTimeout(() => {
        trackSearchPerformed(searchInput.trim(), filteredProducts.length, 'catalogue');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchInput, filteredProducts.length]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set('search', value.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug) {
      newParams.set('category', slug);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSortBy('relevance');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-[#000000] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
    }`}>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Search Bar & Themed Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Typo-Tolerant Input */}
          <div className="md:col-span-8 relative">
            <i className="bi bi-search text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Instant typo-tolerant search (e.g. 'difuser', 'matts', 'cabl', 'led')..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm font-sans border transition-all focus:outline-none focus:border-[#FF000E] focus:ring-1 focus:ring-[#FF000E] ${
                isDark
                  ? 'bg-[#0E0A0B] border-[#261619] text-[#F1EEEE] placeholder-gray-500'
                  : 'bg-white border-[#E0DBD2] text-[#140E10] placeholder-gray-400 shadow-xs'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchInput.trim() && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF000E]/10 border border-[#FF000E]/30 text-[#FF000E]">
                  <i className="bi bi-lightning-charge-fill text-[9px]" aria-hidden="true" />
                  <span>Fuse.js</span>
                </span>
              )}
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer p-0.5"
                  aria-label="Clear search input"
                >
                  <i className="bi bi-x-circle-fill text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Themed Sort Selector */}
          <div className="md:col-span-4 flex items-center gap-2">
            <label className={`text-xs font-mono font-semibold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sort By:</label>
            <div className="relative flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`w-full appearance-none rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-mono border transition-all cursor-pointer focus:outline-none focus:border-[#FF000E] focus:ring-1 focus:ring-[#FF000E] ${
                  isDark
                    ? 'bg-[#0E0A0B] border-[#261619] text-[#F1EEEE] hover:border-[#381B20]'
                    : 'bg-white border-[#E0DBD2] text-[#140E10] hover:border-[#C8C2B6] shadow-xs'
                }`}
              >
                <option value="relevance" className={isDark ? 'bg-[#0E0A0B] text-white' : 'bg-white text-[#140E10]'}>
                  Best Match / Relevance
                </option>
                <option value="price-asc" className={isDark ? 'bg-[#0E0A0B] text-white' : 'bg-white text-[#140E10]'}>
                  Price: Low to High
                </option>
                <option value="price-desc" className={isDark ? 'bg-[#0E0A0B] text-white' : 'bg-white text-[#140E10]'}>
                  Price: High to Low
                </option>
                <option value="rating-desc" className={isDark ? 'bg-[#0E0A0B] text-white' : 'bg-white text-[#140E10]'}>
                  Customer Rating (Highest)
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#FF000E]">
                <i className="bi bi-chevron-down text-xs" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Chips Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap border transition-all cursor-pointer ${
              !selectedCategory
                ? 'bg-[#FF000E] text-white border-[#FF000E] shadow-sm'
                : isDark
                ? 'bg-[#130E10] text-gray-300 border-[#261619] hover:border-gray-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[#FF000E] text-white border-[#FF000E] shadow-sm'
                  : isDark
                  ? 'bg-[#130E10] text-gray-300 border-[#261619] hover:border-gray-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid / Shimmer Loading */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty Search State with helpful suggestions */
          <div className={`p-12 text-center rounded-2xl border space-y-4 my-8 ${
            isDark ? 'bg-[#0E0A0B] border-[#261619]' : 'bg-white border-[#E0DBD2]'
          }`}>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF000E]/10 border border-[#FF000E]/20 text-[#FF000E] flex items-center justify-center text-2xl">
              <i className="bi bi-search" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold">No Matching Accessories Found</h3>
              <p className="text-xs opacity-70 mt-1 max-w-sm mx-auto">
                No items matched "{searchInput}". Even with Fuse.js typo tolerance, we couldn't find a matching product.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
              <button
                type="button"
                onClick={() => handleSearchChange('mats')}
                className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                  isDark ? 'border-[#261619] hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Try "Mats"
              </button>
              <button
                type="button"
                onClick={() => handleSearchChange('diffuser')}
                className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                  isDark ? 'border-[#261619] hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Try "Diffuser"
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
