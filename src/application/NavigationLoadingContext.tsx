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
const FULL_CYCLE_MS = 2400; // Complete cycle of the shrellGo keyframe animation

export const NavigationLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationStartTimeRef = useRef<number>(0);

  const startPageLoad = useCallback(() => {
    // If a hide timer was running, clear it
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    // Schedule loader to display ONLY if page takes longer than DELAY_THRESHOLD_MS
    if (!showTimerRef.current && !isNavigating) {
      showTimerRef.current = setTimeout(() => {
        setIsNavigating(true);
        animationStartTimeRef.current = Date.now();
        showTimerRef.current = null;
      }, DELAY_THRESHOLD_MS);
    }
  }, [isNavigating]);

  const finishPageLoad = useCallback(() => {
    // If the page finished loading quickly (before the delay threshold), cancel the loader
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
      return;
    }

    // If the loader was activated, ensure it displays for at least the full animation cycle (2.4s)
    if (isNavigating) {
      const elapsed = Date.now() - animationStartTimeRef.current;
      const remainingForFullCycle = Math.max(0, FULL_CYCLE_MS - elapsed);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setIsNavigating(false);
        hideTimerRef.current = null;
      }, remainingForFullCycle);
    }
  }, [isNavigating]);

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, startPageLoad, finishPageLoad }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
};

export const useNavigationLoading = () => useContext(NavigationLoadingContext);
