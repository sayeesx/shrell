import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Configure browser scroll restoration to manual so SPA navigations don't restore old scroll positions
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Instant window scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 2. Next animation frame (after layout calculation)
    const rafId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    // 3. Short timeout fallback for dynamic async component re-renders
    const timerId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [pathname, search]);

  return null;
};

