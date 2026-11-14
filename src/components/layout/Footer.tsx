import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../application/ThemeContext';
import { PaymentMethodIcons } from '../common/PaymentMethodIcons';

export const Footer: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <footer className={`border-t text-sm transition-colors duration-300 ${isDark ? 'bg-[#080000] border-[#221215] text-slate-400' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#5C5456]'}`}>
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block group" aria-label="SHRELL Automotive Home">
              <img
                src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'}
                alt="SHRELL Automotive"
                className={`w-auto object-contain transition-opacity group-hover:opacity-90 ${isDark ? 'h-7' : 'h-[30px]'}`}
              />
            </Link>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              Specialized car accessories, touring gear, and precision components designed for Indian road conditions.
            </p>
            <div className={`text-xs pt-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              <span>Support Hours: Mon - Sat (9:30 AM - 6:30 PM IST)</span>
            </div>
          </div>

          {/* Customer Support & Policies */}
          <div>
            <h5 className={`text-xs font-mono uppercase tracking-wider mb-3 font-semibold ${isDark ? 'text-slate-200' : 'text-[#140E10]'}`}>
              Customer Operations
            </h5>
            <ul className="space-y-2 text-xs">
              {[
                { to: '/track', icon: 'bi-geo-alt-fill', label: 'Track Consignment (AWB)' },
                { to: '/shipping-policy', icon: 'bi-box2-heart', label: 'Shipping & Surface Freight' },
                { to: '/returns-policy', icon: 'bi-arrow-counterclockwise', label: 'Returns & Fitment Guarantee' },
                { to: '/privacy-policy', icon: 'bi-lock-fill', label: 'Privacy Policy & Security' },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={`transition-colors flex items-center gap-2 ${isDark ? 'hover:text-white' : 'hover:text-[#140E10]'}`}>
                    <i className={`bi ${item.icon} text-brand-500 text-sm`} aria-hidden="true"></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h5 className={`text-xs font-mono uppercase tracking-wider mb-3 font-semibold ${isDark ? 'text-slate-200' : 'text-[#140E10]'}`}>
              Fulfilment &amp; Warehouse
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <i className="bi bi-pin-map-fill text-brand-500 mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                <span>Plot 42, Chakan Industrial Corridor, Phase II, Pune, Maharashtra 410501</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="bi bi-telephone-fill text-brand-500 flex-shrink-0" aria-hidden="true"></i>
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="bi bi-envelope-fill text-brand-500 flex-shrink-0" aria-hidden="true"></i>
                <span>orders@shrell.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & GST Bar */}
        <div className={`mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between text-[11px] font-mono gap-4 ${isDark ? 'border-[#221215]/80 text-slate-500' : 'border-[#E0DBD2]/80 text-[#8E8587]'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} SHRELL Automotive India Private Limited. All rights reserved.</p>
            <span className="hidden sm:inline">•</span>
            <span>GSTIN: 27AABCV1234F1Z8</span>
          </div>
          <div className="w-full md:w-auto flex justify-center md:justify-end">
            <PaymentMethodIcons className="justify-center md:justify-end" />
          </div>
        </div>
      </div>
    </footer>
  );
};
