import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useCart } from '../../application/CartContext';
import { useVehicle } from '../../application/VehicleContext';
import { HalfArrowIcon } from '../../components/common/HalfArrowIcon';

export const ProfilePage: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { itemCount } = useCart();
  const { selectedVehicle } = useVehicle();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-canvas-50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/80 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto text-gray-500">
            <i className="bi bi-person text-3xl" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Your Account</h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
              Log in with your phone number to access your orders, saved addresses, and profile.
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-3.5 px-6 rounded-full bg-[#1F242F] hover:bg-black text-white font-semibold text-sm transition-all shadow-sm"
          >
            Login with Phone
          </button>
          <div className="pt-2">
            <Link to="/catalogue" className="text-xs text-brand-600 font-semibold hover:underline">
              ← Return to Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedPhone = user.phone
    ? user.phone.replace(/(\d{5})(\d{5})/, '$1 $2')
    : '98765 43210';

  return (
    <div className="min-h-screen bg-canvas-50 py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors group cursor-pointer"
            aria-label="Go back"
          >
            <HalfArrowIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.4} />
            <span>Back</span>
          </button>
          <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
            Account Management
          </span>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-[#0D0F14] text-white flex items-center justify-center text-3xl font-bold flex-shrink-0">
            <i className="bi bi-person-fill" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-950 tracking-tight">
                +91 {formattedPhone}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-center sm:self-auto">
                <i className="bi bi-patch-check-fill text-xs" /> Verified Member
              </span>
            </div>
            <p className="text-xs text-gray-500">
              SHRELL Automotive Indian Customer Account
            </p>
          </div>
        </div>

        {/* Dashboard Grid Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Track Consignment */}
          <Link
            to="/track"
            className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:border-gray-300 transition-all flex items-start gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-100 flex items-center justify-center text-gray-700 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors flex-shrink-0">
              <i className="bi bi-box-seam text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                Track Consignment
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time BlueDart, Delhivery & DTDC tracking.
              </p>
            </div>
            <i className="bi bi-chevron-right text-gray-400 text-xs self-center" />
          </Link>

          {/* 2. Shopping Cart */}
          <Link
            to="/cart"
            className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:border-gray-300 transition-all flex items-start gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-100 flex items-center justify-center text-gray-700 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors flex-shrink-0">
              <i className="bi bi-bag text-xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                  Shopping Bag
                </h2>
                {itemCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review items, apply promo codes, and checkout.
              </p>
            </div>
            <i className="bi bi-chevron-right text-gray-400 text-xs self-center" />
          </Link>

          {/* 3. My Vehicle Garage */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-surface-100 flex items-center justify-center text-gray-700 flex-shrink-0">
              <i className="bi bi-car-front text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">Vehicle Garage</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedVehicle
                  ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                  : 'Universal fitment active.'}
              </p>
            </div>
          </div>

          {/* 4. WhatsApp Technical Support */}
          <a
            href="https://wa.me/919876543210?text=Hi%20SHRELL%20Automotive%20Team,%20I%20need%20assistance%20with%20my%20account."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:border-gray-300 transition-all flex items-start gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <i className="bi bi-whatsapp text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                WhatsApp Desk
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chat directly with technical support.
              </p>
            </div>
            <i className="bi bi-chevron-right text-gray-400 text-xs self-center" />
          </a>
        </div>

        {/* Logout Section */}
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-semibold text-gray-700 transition-all"
          >
            <i className="bi bi-box-arrow-right text-sm" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
