import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './application/AuthContext';
import { VehicleProvider } from './application/VehicleContext';
import { CartProvider } from './application/CartContext';
import { NavigationLoadingProvider } from './application/NavigationLoadingContext';
import { App } from './App';
import './styles/index.css';

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
        <NavigationLoadingProvider>
          <AuthProvider>
            <VehicleProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </VehicleProvider>
          </AuthProvider>
        </NavigationLoadingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
