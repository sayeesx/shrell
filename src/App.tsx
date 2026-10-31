import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileNavDock } from './components/layout/MobileNavDock';
import { AuthModal } from './components/auth/AuthModal';
import { CheckoutModal } from './components/checkout/CheckoutModal';

// Storefront Pages
import { HomePage } from './pages/storefront/HomePage';
import { CataloguePage } from './pages/storefront/CataloguePage';
import { ProductDetailPage } from './pages/storefront/ProductDetailPage';
import { CartPage } from './pages/storefront/CartPage';
import { OrderTrackingPage } from './pages/storefront/OrderTrackingPage';
import { PoliciesPage } from './pages/storefront/PoliciesPage';
import { ProfilePage } from './pages/storefront/ProfilePage';
import { OfflinePage } from './pages/storefront/OfflinePage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminSettings } from './pages/admin/AdminSettings';

import { ScrollToTop } from './components/common/ScrollToTop';
import { ShrellLoader } from './components/common/ShrellLoader';

export const App: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';
  const isCataloguePage = location.pathname.startsWith('/catalogue');

  // Page load & route change navigation loader
  const [isNavigating, setIsNavigating] = React.useState<boolean>(true);

  React.useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Network offline state listener
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Display offline page when connection is lost (unless user is explicitly testing /offline route)
  if (!isOnline && location.pathname !== '/offline') {
    return <OfflinePage onRetry={() => setIsOnline(navigator.onLine)} />;
  }

  // Header is displayed ONLY in Home page and Category / Catalogue pages
  const shouldShowHeader = !isAdminRoute && (isHomePage || isCataloguePage);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE] font-sans antialiased pb-16 md:pb-0">
      {/* Page Load & Navigation Shrell Loader */}
      {isNavigating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0808]/85 backdrop-blur-sm pointer-events-none transition-opacity duration-300"
          aria-live="polite"
        >
          <div className="p-6 rounded-2xl bg-[#140E10]/95 border border-[#261619] shadow-2xl flex items-center justify-center">
            <ShrellLoader size={68} />
          </div>
        </div>
      )}

      <ScrollToTop />

      {/* Global Phone & 4-Digit Verification Modal */}
      <AuthModal />

      {/* Global Checkout Modal */}
      <CheckoutModal />

      {/* Storefront Navigation: Only on Home and Category pages */}
      {shouldShowHeader && <Navbar />}

      {/* Main Content View */}
      <div className="flex-1">
        <Routes>
          {/* Storefront Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Navigate to="/cart" replace />} />
          <Route path="/track" element={<OrderTrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/offline" element={<OfflinePage onRetry={() => setIsOnline(true)} />} />
          <Route path="/shipping-policy" element={<PoliciesPage />} />
          <Route path="/returns-policy" element={<PoliciesPage />} />
          <Route path="/privacy-policy" element={<PoliciesPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardOverview />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Storefront Footer (Rendered strictly on home page) */}
      {location.pathname === '/' && <Footer />}

      {/* Mobile Floating Bottom Navigation Dock */}
      {!isAdminRoute && <MobileNavDock />}
    </div>
  );
};
