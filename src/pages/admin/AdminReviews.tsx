import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductReview } from '../../domain/types';
import { productRepository, reviewRepository } from '../../infrastructure/repositories';
import { useTheme } from '../../application/ThemeContext';
import { SquareGridLoader } from '../../components/common/SquareGridLoader';

export const AdminReviews: React.FC = () => {
  const { isDark } = useTheme();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 5 | 4 | 3 | 2 | 1>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [allReviews, prodRes] = await Promise.all([
        reviewRepository.getAllReviews(),
        productRepository.getAll({ limit: 200 }),
      ]);

      const map: Record<string, Product> = {};
      for (const p of prodRes.products) {
        map[p.id] = p;
      }

      setReviews(allReviews);
      setProductMap(map);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setErrorMsg('Failed to load customer reviews. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteReview = async (id: string) => {
    try {
      setDeletingId(id);
      setErrorMsg('');
      const ok = await reviewRepository.deleteReview(id);
      if (ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setConfirmDeleteId(null);
      } else {
        setErrorMsg('Could not delete review. Please verify permissions and retry.');
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
      setErrorMsg('An error occurred while deleting the review.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (/shrell\s*(operator|operations|admin|director)|operator/i.test(r.authorName)) {
      return false;
    }
    if (ratingFilter !== 'ALL' && Math.round(r.rating) !== ratingFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const productName = productMap[r.productId]?.name?.toLowerCase() || '';
    return (
      r.authorName.toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      productName.includes(q) ||
      r.productId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Customer Reviews Moderation
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Inspect product ratings and remove spam or policy-violating reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer self-start ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
          }`}
        >
          <i className="bi bi-arrow-clockwise text-sm" aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
          <input
            type="text"
            aria-label="Search reviews"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product, or review text..."
            className={`w-full pl-9 pr-3.5 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 5, 4, 3, 2, 1] as const).map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setRatingFilter(rating)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                ratingFilter === rating
                  ? 'bg-[#FF000E] text-white'
                  : isDark
                    ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
            >
              {rating === 'ALL' ? `All (${reviews.length})` : `${rating} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-rose-400" aria-hidden="true" />
            <span>{errorMsg}</span>
          </span>
          <button
            type="button"
            onClick={loadData}
            className="text-xs font-mono font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <SquareGridLoader size={44} color="#FF000E" />
          <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading product reviews...
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          className={`rounded-2xl border p-10 text-center space-y-2 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <i className="bi bi-chat-square-text text-3xl text-slate-400" aria-hidden="true" />
          <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No Matching Reviews
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {reviews.length === 0
              ? 'Customer reviews submitted on product pages will appear here.'
              : 'Clear your search or rating filter to view all reviews.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const product = productMap[review.productId];
            const isConfirming = confirmDeleteId === review.id;
            const isDeleting = deletingId === review.id;

            return (
              <div
                key={review.id}
                className={`rounded-xl border p-4 sm:p-5 space-y-3 transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {review.authorName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                            isDark
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}
                        >
                          <i className="bi bi-patch-check-fill text-[10px]" aria-hidden="true" />
                          Verified
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-amber-400 text-xs" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <i
                            key={idx}
                            className={`bi ${idx < review.rating ? 'bi-star-fill' : 'bi-star text-slate-500'}`}
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    </div>

                    <div className={`text-[11px] font-mono flex flex-wrap items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span>Product:</span>
                      {product ? (
                        <Link
                          to={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#FF000E] hover:underline"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{review.productId}</span>
                      )}
                      <span>•</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Delete Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isConfirming ? (
                      <>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteReview(review.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setConfirmDeleteId(null)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                            isDark
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(review.id)}
                        aria-label={`Delete review by ${review.authorName}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                          isDark
                            ? 'border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                            : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <i className="bi bi-trash3 text-xs" aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {review.title && (
                  <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {review.title}
                  </h3>
                )}
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {review.comment}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
