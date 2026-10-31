import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useCart } from '../../application/CartContext';
import { useVehicle } from '../../application/VehicleContext';
import { HalfArrowIcon } from '../../components/common/HalfArrowIcon';
import { useSafeBack } from '../../components/common/useSafeBack';

export const ProfilePage: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { itemCount } = useCart();
  const { selectedVehicle } = useVehicle();
  const handleGoBack = useSafeBack('/catalogue');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#0D0F14]">
        <div className="max-w-md w-full bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto text-slate-400">
            <i className="bi bi-person text-3xl" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Account</h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
              Log in with your phone number to access your orders, saved addresses, and profile.
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-3.5 px-6 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            Login with Phone
          </button>
          <div className="pt-2">
            <Link to="/catalogue" className="text-xs text-brand-400 font-semibold hover:underline">
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
    <div className="min-h-screen bg-[#0D0F14] py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 border border-surface-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors group cursor-pointer"
              aria-label="Go back"
            >
              <HalfArrowIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.4} />
              <span>Back</span>
            </button>

            {/* SHRELL logo near Go Back as main home page button */}
            <Link to="/" className="flex items-center group cursor-pointer" aria-label="SHRELL Home">
              <img
                src="/logos/shrell-logo-white.png"
                alt="SHRELL Automotive"
                className="h-6 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase font-mono">
            Account Management
          </span>
        </div>

        {/* User Profile Card */}
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-[#090B0E] border border-surface-800 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0">
            <i className="bi bi-person-fill" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                +91 {formattedPhone}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800 self-center sm:self-auto">
                <i className="bi bi-patch-check-fill text-xs" /> Verified Member
              </span>
            </div>
            <p className="text-xs text-slate-400">
              SHRELL Automotive Indian Customer Account
            </p>
          </div>
        </div>

        {/* Dashboard Grid Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Track Consignment */}
          <Link
            to="/track"
            className="bg-surface-900 rounded-2xl border border-surface-800 p-5 hover:border-surface-700 transition-all flex items-start gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-800 flex items-center justify-center text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400 transition-colors flex-shrink-0">
              <i className="bi bi-box-seam text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                Track Consignment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time BlueDart, Delhivery & DTDC tracking.
              </p>
            </div>
            <i className="bi bi-chevron-right text-slate-500 text-xs self-center" />
          </Link>

          {/* 2. Shopping Cart */}
          <Link
            to="/cart"
            className="bg-surface-900 rounded-2xl border border-surface-800 p-5 hover:border-surface-700 transition-all flex items-start gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-800 flex items-center justify-center text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400 transition-colors flex-shrink-0">
              <i className="bi bi-bag text-xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                  Shopping Bag
                </h2>
                {itemCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review items, apply promo codes, and checkout.
              </p>
            </div>
            <i className="bi bi-chevron-right text-slate-500 text-xs self-center" />
          </Link>

          {/* 3. My Vehicle Garage */}
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-surface-800 flex items-center justify-center text-slate-300 flex-shrink-0">
              <i className="bi bi-car-front text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white">Vehicle Garage</h2>
              <p className="text-xs text-slate-400 mt-0.5">
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
            className="bg-surface-900 rounded-2xl border border-surface-800 p-5 hover:border-surface-700 transition-all flex items-start gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <i className="bi bi-whatsapp text-xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                WhatsApp Desk
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chat directly with technical support.
              </p>
            </div>
            <i className="bi bi-chevron-right text-slate-500 text-xs self-center" />
          </a>
        </div>

        {/* Logout Section */}
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-surface-700 bg-surface-900 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-800 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <i className="bi bi-box-arrow-right text-sm" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
