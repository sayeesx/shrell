import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product } from '../../domain/types';
import { productRepository } from '../../infrastructure/repositories';
import { ProductCard } from '../../components/ui/ProductCard';

export const CataloguePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-surface-800 pb-4 sm:pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Equipment Catalogue
          </h1>
          {search && (
            <p className="text-xs text-slate-400 mt-1">
              Search results for: <span className="font-semibold text-white">"{search}"</span>
            </p>
          )}
        </div>

        {search && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-brand-500 hover:text-brand-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <i className="bi bi-x-circle" aria-hidden="true"></i>
            <span>Clear Search</span>
          </button>
        )}
      </div>

      {/* Full-width Product Grid */}
      <main className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 sm:h-80 rounded-lg bg-surface-900 animate-pulse border border-surface-800" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-surface-900 border border-surface-800 space-y-4 max-w-lg mx-auto">
            <i className="bi bi-box-seam text-4xl text-slate-500" aria-hidden="true"></i>
            <h3 className="text-base font-bold text-white">No accessories found</h3>
            <p className="text-xs text-slate-400">
              We couldn't find any accessories matching your criteria. Try browsing our entire collection.
            </p>
            <div>
              <Link
                to="/catalogue"
                onClick={handleClearFilters}
                className="inline-block px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
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
