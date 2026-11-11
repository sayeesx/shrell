import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-[#221215]/40 dark:border-[#221215]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono opacity-60 mb-1">
              <Link to="/" className="hover:underline">Home</Link>
              <span>/</span>
              <span className="text-[#FF000E] font-semibold">Catalogue</span>
              {selectedCategory && (
                <>
                  <span>/</span>
                  <span className="capitalize">{selectedCategory.replace(/-/g, ' ')}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Automotive Parts &amp; Touring Equipment
            </h1>
            <p className="text-xs sm:text-sm opacity-70 mt-0.5">
              Precision engineered automotive hardware compatible with all major Indian platforms
            </p>
          </div>

          {/* Quick Stats & Typo-Tolerant Engine Badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono self-start md:self-auto">
            {searchInput.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FF000E]/10 border border-[#FF000E]/30 text-[#FF000E]">
                <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
                <span>Typo-Tolerant (Fuse.js)</span>
              </span>
            )}
            <span className={`px-3 py-1 rounded-full border text-[11px] ${
              isDark ? 'bg-[#130E10] border-[#261619] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
            }`}>
              {loading ? 'Searching...' : `${filteredProducts.length} Products Found`}
            </span>
          </div>
        </div>

        {/* Search Bar & Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Typo-Tolerant Input */}
          <div className="md:col-span-8 relative">
            <i className="bi bi-search text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Instant typo-tolerant search (e.g. 'difuser', 'matts', 'cabl', 'led')..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-sans border transition-all focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
                isDark
                  ? 'bg-[#0E0A0B] border-[#261619] text-[#F1EEEE] placeholder-gray-500'
                  : 'bg-white border-[#E0DBD2] text-[#140E10] placeholder-gray-400 shadow-xs'
              }`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                aria-label="Clear search input"
              >
                <i className="bi bi-x-circle-fill text-sm" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-4 flex items-center gap-2">
            <label className="text-xs font-mono font-semibold shrink-0 opacity-70">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={`w-full rounded-xl px-3 py-2.5 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-[#FF000E] cursor-pointer ${
                isDark
                  ? 'bg-[#0E0A0B] border-[#261619] text-[#F1EEEE]'
                  : 'bg-white border-[#E0DBD2] text-[#140E10]'
              }`}
            >
              <option value="relevance">Best Match / Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Customer Rating (Highest)</option>
            </select>
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
