import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getGlobalLenis } from './SmoothScrollProvider';

// Configure browser scroll restoration to manual so SPA navigations don't restore old scroll positions
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const lenis = getGlobalLenis();

    // If an anchor hash is present, smoothly scroll the target element into view
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const element = document.getElementById(targetId);
      if (element) {
        if (lenis) {
          lenis.scrollTo(element, { offset: -60, duration: 1.0 });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      const timerId = setTimeout(() => {
        const delayedEl = document.getElementById(targetId);
        if (delayedEl) {
          if (lenis) {
            lenis.scrollTo(delayedEl, { offset: -60, duration: 1.0 });
          } else {
            delayedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
      return () => clearTimeout(timerId);
    }

    // 0. Sync Lenis instantly to top
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }

    // 1. Instant window scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 2. Next animation frame (after layout calculation)
    const rafId = requestAnimationFrame(() => {
      if (lenis) lenis.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    // 3. Short timeout fallback for dynamic async component re-renders
    const timerId = setTimeout(() => {
      if (lenis) lenis.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [pathname, hash]);

  return null;
};

