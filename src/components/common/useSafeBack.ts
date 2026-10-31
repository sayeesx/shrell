import { useNavigate } from 'react-router-dom';

/**
 * Hook for safe back navigation.
 * Prevents 404 or leaving the application when user accesses a page directly or reloads (history index <= 0).
 */
export const useSafeBack = (fallbackPath = '/catalogue') => {
  const navigate = useNavigate();

  return () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };
};
