import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileNavDock } from './components/layout/MobileNavDock';
import { AuthModal } from './components/auth/AuthModal';

// Storefront Pages
import { HomePage } from './pages/storefront/HomePage';
import { CataloguePage } from './pages/storefront/CataloguePage';
import { ProductDetailPage } from './pages/storefront/ProductDetailPage';
import { CartPage } from './pages/storefront/CartPage';
import { CheckoutPage } from './pages/storefront/CheckoutPage';
import { OrderTrackingPage } from './pages/storefront/OrderTrackingPage';
import { PoliciesPage } from './pages/storefront/PoliciesPage';
import { ProfilePage } from './pages/storefront/ProfilePage';

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

export const App: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCheckoutRoute = location.pathname === '/checkout';
  const isHomePage = location.pathname === '/';
  const isCataloguePage = location.pathname.startsWith('/catalogue');

  // Header is displayed ONLY in Home page and Category / Catalogue pages
  const shouldShowHeader = !isAdminRoute && !isCheckoutRoute && (isHomePage || isCataloguePage);

  return (
    <div className="min-h-screen flex flex-col bg-canvas-50 text-gray-900 font-sans antialiased pb-16 md:pb-0">
      <ScrollToTop />

      {/* Global Phone & 4-Digit Verification Modal */}
      <AuthModal />

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
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/track" element={<OrderTrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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
        </Routes>
      </div>

      {/* Mobile Navigation Dock: Categories, Featured, Deals, Profile */}
      <MobileNavDock />

      {/* Storefront Footer: Displayed exclusively on main home page */}
      {isHomePage && <Footer />}
    </div>
  );
};
