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
import { SEOHead } from '../../infrastructure/seo/SEOHead';
import { generateBreadcrumbSchema } from '../../infrastructure/seo/schemaGenerators';
import { isGibberishSearchQuery } from '../../utils/searchClassifier';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc';

export const CataloguePage: React.FC = () => {
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlSort = searchParams.get('sort');
  const sortBy: SortOption =
    urlSort === 'price-asc' || urlSort === 'price-desc' || urlSort === 'rating-desc'
      ? urlSort
      : 'relevance';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);

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
    setSearchParams({}, { replace: true });
  };

  const matchedCategory = useMemo(() => {
    if (!urlCategory) return null;
    const catLower = urlCategory.toLowerCase();
    return categories.find(
      (c) => c.slug.toLowerCase() === catLower || c.id.toLowerCase() === catLower
    );
  }, [categories, urlCategory]);

  const pageTitle = matchedCategory
    ? `${matchedCategory.name} | Buy Online at SHRELL`
    : 'Car Accessories & Touring Equipment Catalogue | SHRELL Automotive';

  const pageDescription = matchedCategory
    ? (matchedCategory.description || `Browse high-performance ${matchedCategory.name} engineered for Indian vehicles. Buy online at SHRELL.`)
    : 'Explore the complete SHRELL Automotive equipment catalogue: auxiliary lighting, aerodynamic crossbars, 7D floor liners, and heavy-duty 12V tyre inflators.';

  const canonicalPath = matchedCategory
    ? `/catalogue?category=${encodeURIComponent(matchedCategory.slug)}`
    : '/catalogue';

  const breadcrumbItems = matchedCategory
    ? [
        { name: 'Home', url: '/' },
        { name: 'Catalogue', url: '/catalogue' },
        { name: matchedCategory.name, url: canonicalPath },
      ]
    : [
        { name: 'Home', url: '/' },
        { name: 'Catalogue', url: '/catalogue' },
      ];

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-[#000000] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'
    }`}>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={canonicalPath}
        noIndex={Boolean(urlQuery.trim())}
        structuredData={generateBreadcrumbSchema(breadcrumbItems)}
      />
      <div className="max-w-7xl mx-auto space-y-4">
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
          /* Empty Search State (no background or shadow around image) */
          <div className="p-6 sm:p-10 text-center space-y-4 my-6 bg-transparent border-0 shadow-none">
            {isGibberishSearchQuery(searchInput) ? (
              <>
                <div className="space-y-1">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                    Is that you, Milo?
                  </h3>
                  <p className={`text-xs sm:text-sm max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-[#5C5456]'}`}>
                    Milo must be walking on the keyboard again. Try searching a real accessory name!
                  </p>
                </div>
                <img
                  src="/images/catsearching.avif"
                  alt="Milo the cat typing random keys on keyboard"
                  className="w-44 h-44 sm:w-52 sm:h-52 mx-auto object-contain bg-transparent border-0 shadow-none"
                  style={{ boxShadow: 'none', background: 'transparent' }}
                />
              </>
            ) : (
              <>
                <img
                  src="/images/Chill Guy PNG.png"
                  alt="Item not found in inventory"
                  className="w-44 h-44 sm:w-52 sm:h-52 mx-auto object-contain bg-transparent border-0 shadow-none"
                  style={{ boxShadow: 'none', background: 'transparent' }}
                />
                <div className="space-y-1">
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                    This item is not found in our inventory
                  </h3>
                  <p className={`text-xs sm:text-sm max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-[#5C5456]'}`}>
                    {searchInput.trim()
                      ? `Nothing matched "${searchInput}" right now. Check back soon or explore another category.`
                      : 'No accessories matched the active filter right now.'}
                  </p>
                </div>
              </>
            )}
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
