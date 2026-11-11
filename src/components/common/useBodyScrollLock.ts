import { useEffect } from 'react';

/**
 * Custom hook to lock body scrolling when a modal or dialog is open,
 * preventing background scrolling while compensating for scrollbar shift.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    // Save previous overflow & padding
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Lock main content scroll containers if present (e.g. admin layout)
    const mains = Array.from(document.querySelectorAll('main')) as HTMLElement[];
    const mainOverflows = mains.map((m) => m.style.overflow);
    mains.forEach((m) => {
      m.style.overflow = 'hidden';
    });

    // Calculate scrollbar width to prevent horizontal layout jerk
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      mains.forEach((m, idx) => {
        m.style.overflow = mainOverflows[idx] || '';
      });
    };
  }, [isLocked]);
}
