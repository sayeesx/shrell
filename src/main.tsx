import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from '@posthog/react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './application/AuthContext';
import { VehicleProvider } from './application/VehicleContext';
import { CartProvider } from './application/CartContext';
import { NavigationLoadingProvider } from './application/NavigationLoadingContext';
import { ThemeProvider } from './application/ThemeContext';
import { App } from './App';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/index.css';

const posthogOptions = {
  api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  defaults: '2026-08-30',
  capture_performance: true,
} as const;

const posthogToken =
  import.meta.env.VITE_POSTHOG_PROJECT_TOKEN ||
  import.meta.env.VITE_POSTHOG_KEY ||
  '';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Prevent mouse wheel from inadvertently changing number input digits
if (typeof window !== 'undefined') {
  window.addEventListener(
    'wheel',
    () => {
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT' && (active as HTMLInputElement).type === 'number') {
        (active as HTMLInputElement).blur();
      }
    },
    { passive: true }
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <PostHogProvider apiKey={posthogToken} options={posthogOptions}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <NavigationLoadingProvider>
                <AuthProvider>
                  <VehicleProvider>
                    <CartProvider>
                      <App />
                    </CartProvider>
                  </VehicleProvider>
                </AuthProvider>
              </NavigationLoadingProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </PostHogProvider>
    </HelmetProvider>
  </React.StrictMode>
);
