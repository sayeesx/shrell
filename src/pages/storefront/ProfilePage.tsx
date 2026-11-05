import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useCart } from '../../application/CartContext';
import { useVehicle } from '../../application/VehicleContext';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

export const ProfilePage: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { itemCount } = useCart();
  const { selectedVehicle } = useVehicle();
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();

  useEffect(() => {
    window.scrollTo(0, 0);
    finishPageLoad();
  }, [finishPageLoad]);

  if (!user) {
    return (
      <div className={`min-h-[75vh] flex items-center justify-center px-4 py-16 ${isDark ? 'bg-[#0D0F14]' : 'bg-[#FFFEFA]'}`}>
        <div className={`max-w-md w-full rounded-2xl border p-8 text-center space-y-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-surface-800 border-surface-700 border text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] border text-[#8E8587]'}`}>
            <i className="bi bi-person text-3xl" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>Your Account</h1>
            <p className={`text-xs sm:text-sm max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              Log in with your phone number to access your orders, saved addresses, and profile.
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-3.5 px-6 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all cursor-pointer"
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
    <div className={`min-h-screen py-6 sm:py-10 px-4 sm:px-6 ${isDark ? 'bg-[#0D0F14]' : 'bg-[#FFFEFA]'}`}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Navigation Breadcrumb / Home Link */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center group cursor-pointer" aria-label="SHRELL Home">
            <img
              src="/logos/shrell-logo-white.png"
              alt="SHRELL Automotive"
              className={`h-[22px] w-auto object-contain ${!isDark ? 'brightness-0' : ''}`}
            />
          </Link>
          <span className={`text-[11px] font-bold tracking-wider uppercase font-mono ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`}>
            Account Management
          </span>
        </div>

        {/* User Profile Card */}
        <div className={`rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'}`}>
          <div className={`w-20 h-20 rounded-full border flex items-center justify-center text-3xl font-bold flex-shrink-0 ${isDark ? 'bg-[#090B0E] border-surface-800 text-white' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
            <i className="bi bi-person-fill" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#140E10]'}`}>
                +91 {formattedPhone}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold self-center sm:self-auto ${isDark ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                <i className="bi bi-patch-check-fill text-xs" /> Verified Member
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              SHRELL Automotive Indian Customer Account
            </p>
          </div>
        </div>

        {/* Dashboard Grid Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/track" className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'}`}>
              <i className="bi bi-box-seam text-xl" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-brand-400' : 'text-[#140E10] group-hover:text-[#FF000E]'}`}>Track Consignment</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Real-time BlueDart, Delhivery & DTDC tracking.</p>
            </div>
            <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
          </Link>

          <Link to="/cart" className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-[#FF000E]/40'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-surface-800 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400' : 'bg-[#F5F3EE] text-[#5C5456] group-hover:bg-[#FFE0E2] group-hover:text-[#FF000E]'}`}>
              <i className="bi bi-bag text-xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-brand-400' : 'text-[#140E10] group-hover:text-[#FF000E]'}`}>Shopping Bag</h2>
                {itemCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white">{itemCount}</span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Review items, apply promo codes, and checkout.</p>
            </div>
            <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
          </Link>

          <div className={`rounded-2xl border p-5 flex items-start gap-4 ${isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-[#E0DBD2]'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-surface-800 text-slate-300' : 'bg-[#F5F3EE] text-[#5C5456]'}`}>
              <i className="bi bi-car-front text-xl" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#140E10]'}`}>Vehicle Garage</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
                {selectedVehicle
                  ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                  : 'Universal fitment active.'}
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/919876543210?text=Hi%20SHRELL%20Automotive%20Team,%20I%20need%20assistance%20with%20my%20account."
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-2xl border p-5 transition-all flex items-start gap-4 group ${isDark ? 'bg-surface-900 border-surface-800 hover:border-surface-700' : 'bg-white border-[#E0DBD2] hover:border-emerald-300'}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
              <i className="bi bi-whatsapp text-xl" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-bold transition-colors ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-[#140E10] group-hover:text-emerald-600'}`}>WhatsApp Desk</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Chat directly with technical support.</p>
            </div>
            <i className={`bi bi-chevron-right text-xs self-center ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
          </a>
        </div>

        {/* Logout Section */}
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={logout}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${isDark ? 'border-surface-700 bg-surface-900 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-800 text-slate-300' : 'border-[#E0DBD2] bg-white hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 text-[#5C5456]'}`}
          >
            <i className="bi bi-box-arrow-right text-sm" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
