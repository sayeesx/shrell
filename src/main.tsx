import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './application/AuthContext';
import { VehicleProvider } from './application/VehicleContext';
import { CartProvider } from './application/CartContext';
import { NavigationLoadingProvider } from './application/NavigationLoadingContext';
import { ThemeProvider } from './application/ThemeContext';
import { App } from './App';
import { initPostHog } from './infrastructure/analytics/posthog';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/index.css';

// Initialize PostHog client analytics
initPostHog();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
