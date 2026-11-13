import React, { useEffect, useRef, createContext, useContext } from 'react';
import Lenis from 'lenis';

interface SmoothScrollContextType {
  lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({ lenis: null });

let globalLenisInstance: Lenis | null = null;

/**
 * Access the active global Lenis instance anywhere in the app
 * (e.g. for locking scroll during modals or triggering immediate scrollToTop).
 */
export const getGlobalLenis = (): Lenis | null => globalLenisInstance;

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

/**
 * High-performance Awwwards-grade buttery smooth scroll provider using Lenis.
 * Features:
 * - Fluid exponential easing (Math.min(1, 1.001 - Math.pow(2, -10 * t)))
 * - Automatic hardware acceleration and RAF loop
 * - Full accessibility check: honors `prefers-reduced-motion`
 * - Coexists seamlessly with native browser gestures and touchscreens
 */
export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect reduced motion accessibility
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Buttery exponential ease-out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.25,
      syncTouch: false,
    });

    lenisRef.current = lenis;
    globalLenisInstance = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      if (globalLenisInstance === lenis) {
        globalLenisInstance = null;
      }
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisRef.current }}>
      {children}
    </SmoothScrollContext.Provider>
  );
};

export const useSmoothScroll = () => useContext(SmoothScrollContext);
