import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface NavigationLoadingContextValue {
  isNavigating: boolean;
  startPageLoad: () => void;
  finishPageLoad: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue>({
  isNavigating: false,
  startPageLoad: () => {},
  finishPageLoad: () => {},
});

const DELAY_THRESHOLD_MS = 320; // Only trigger loader if page load exceeds this duration
const FULL_CYCLE_MS = 2400;     // Complete cycle of the shrellGo keyframe animation

export const NavigationLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);

  // Track state in a ref so callbacks don't need isNavigating in their deps array
  // This prevents stale-closure re-render loops in admin pages.
  const isNavigatingRef = useRef(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationStartTimeRef = useRef<number>(0);

  const setNavigating = (value: boolean) => {
    isNavigatingRef.current = value;
    setIsNavigating(value);
  };

  // Stable: no deps that change between renders
  const startPageLoad = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!showTimerRef.current && !isNavigatingRef.current) {
      showTimerRef.current = setTimeout(() => {
        setNavigating(true);
        animationStartTimeRef.current = Date.now();
        showTimerRef.current = null;
      }, DELAY_THRESHOLD_MS);
    }
  }, []); // stable — uses ref not state

  // Stable: no deps that change between renders
  const finishPageLoad = useCallback(() => {
    // Cancel pending show timer (page loaded fast — no loader needed)
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
      // Even if not navigating visually, make sure state is clean
      if (isNavigatingRef.current) {
        setNavigating(false);
      }
      return;
    }

    // If loader is visible, ensure it completes at least one full animation cycle
    if (isNavigatingRef.current) {
      const elapsed = Date.now() - animationStartTimeRef.current;
      const remainingForFullCycle = Math.max(0, FULL_CYCLE_MS - elapsed);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setNavigating(false);
        hideTimerRef.current = null;
      }, remainingForFullCycle);
    }
  }, []); // stable — uses ref not state

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, startPageLoad, finishPageLoad }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
};

export const useNavigationLoading = () => useContext(NavigationLoadingContext);
