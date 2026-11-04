import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product } from '../../domain/types';
import { productRepository } from '../../infrastructure/repositories';
import { ProductCard } from '../../components/ui/ProductCard';
import { CategoryCircleStrip } from '../../components/ui/CategoryCircleStrip';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';

export const CataloguePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Read filter query from URL if navigated from navbar or category pills
  const search = searchParams.get('search') || '';
  const selectedCategorySlug = searchParams.get('category') || '';
  const selectedBrandSlug = searchParams.get('brand') || '';

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const result = await productRepository.getAll({
          search: search || undefined,
          categorySlug: selectedCategorySlug || undefined,
          brandSlug: selectedBrandSlug || undefined,
          sort: 'newest',
        });
        setProducts(result.products);
      } catch (err) {
        console.error('Catalogue fetch error:', err);
      } finally {
        setLoading(false);
        finishPageLoad();
      }
    }

    const timer = setTimeout(() => {
      fetchProducts();
    }, 100);

    return () => clearTimeout(timer);
  }, [search, selectedCategorySlug, selectedBrandSlug]);

  const handleClearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Zone Category Menu Strip */}
      <section className={`pt-1 sm:pt-2 pb-3 sm:pb-4 rounded-xl sm:rounded-2xl border px-3 sm:px-6 shadow-sm ${isDark ? 'bg-[#0A0808] text-white border-[#221215]' : 'bg-[#F5F3EE] text-[#140E10] border-[#E0DBD2]'}`}>
        <CategoryCircleStrip className="-mx-2 px-2 sm:mx-0 sm:px-0" />
      </section>

      {/* Page Header */}
      <div className={`flex items-center justify-between border-b pb-4 sm:pb-5 ${isDark ? 'border-[#221215]' : 'border-[#E0DBD2]'}`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
            Equipment Catalogue
          </h1>
          {search && (
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              Search results for: <span className={`font-medium ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>"{search}"</span>
            </p>
          )}
        </div>
        {search && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-[#FF000E] hover:text-[#E0000C] font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <i className="bi bi-x-circle" aria-hidden="true"></i>
            <span>Clear Search</span>
          </button>
        )}
      </div>

      {/* Full-width Product Grid */}
      <main className="space-y-6">
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center py-20">
            <ShrellLoader size={76} />
          </div>
        ) : products.length === 0 ? (
          <div className={`p-12 text-center rounded-xl border space-y-4 max-w-lg mx-auto ${isDark ? 'bg-[#0E0A0B] border-[#221215]' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
            <i className={`bi bi-box-seam text-4xl ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} aria-hidden="true"></i>
            <h3 className={`text-base font-semibold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>No accessories found</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              We couldn't find any accessories matching your criteria. Try browsing our entire collection.
            </p>
            <div>
              <Link
                to="/catalogue"
                onClick={handleClearFilters}
                className="inline-block px-5 py-2.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-medium transition-colors"
              >
                View All Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
