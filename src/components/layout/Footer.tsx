import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080000] border-t border-[#221215] text-slate-400 text-sm">
      {/* Trust Pillars */}
      <div className="border-b border-[#221215]/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#0E0A0B] border border-[#221215] text-[#FF000E] flex-shrink-0">
              <i className="bi bi-patch-check-fill text-lg leading-none" aria-hidden="true"></i>
            </div>
            <div>
              <h4 className="text-slate-100 font-semibold text-sm">Engineered Precision</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                TPE laser-fit floor liners, extruded T6 aluminium cargo racks, and homologated ECE auxiliary lighting.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#0E0A0B] border border-[#221215] text-[#FF000E] flex-shrink-0">
              <i className="bi bi-truck text-lg leading-none" aria-hidden="true"></i>
            </div>
            <div>
              <h4 className="text-slate-100 font-semibold text-sm">Insured Direct Transit</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                All consignments packed in heavy duty corrugated crates and tracked via BlueDart Express &amp; Delhivery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#0E0A0B] border border-[#221215] text-[#FF000E] flex-shrink-0">
              <i className="bi bi-arrow-repeat text-lg leading-none" aria-hidden="true"></i>
            </div>
            <div>
              <h4 className="text-slate-100 font-semibold text-sm">7-Day Fitment Guarantee</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Complete replacement or hassle-free return if the accessory does not mate cleanly with your vehicle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block group" aria-label="SHRELL Automotive Home">
              <img
                src="/logos/shrell-logo-white.png"
                alt="SHRELL Automotive"
                className="h-7 w-auto object-contain transition-opacity group-hover:opacity-90"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Specialized car accessories, overland gear, and precision components designed for Indian road conditions.
            </p>
            <div className="text-xs text-slate-400 pt-1">
              <span>Support Hours: Mon - Sat (9:30 AM - 6:30 PM IST)</span>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h5 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3 font-semibold">
              Equipment Categories
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/catalogue?category=air-fresheners" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-tree-fill text-brand-500 text-sm" aria-hidden="true"></i>
                  Air Fresheners &amp; Fragrance
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=auxiliary-lighting" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-lightbulb-fill text-brand-500 text-sm" aria-hidden="true"></i>
                  OSRAM Auxiliary Lighting
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=all-weather-floor-protection" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-shield-fill-check text-brand-500 text-sm" aria-hidden="true"></i>
                  Laser 3D TPE Floor Liners
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=tyre-care-air-systems" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-speedometer2 text-brand-500 text-sm" aria-hidden="true"></i>
                  12V Heavy Duty Compressors
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=touring-recovery-gear" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-tools text-brand-500 text-sm" aria-hidden="true"></i>
                  Kinetic Recovery Systems
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Policies (No admin link) */}
          <div>
            <h5 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3 font-semibold">
              Customer Operations
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/track" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-geo-alt-fill text-brand-500 text-sm" aria-hidden="true"></i>
                  Track Consignment (AWB)
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-box2-heart text-brand-500 text-sm" aria-hidden="true"></i>
                  Shipping &amp; Surface Freight
                </Link>
              </li>
              <li>
                <Link to="/returns-policy" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-arrow-counterclockwise text-brand-500 text-sm" aria-hidden="true"></i>
                  Returns &amp; Fitment Guarantee
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors flex items-center gap-2">
                  <i className="bi bi-lock-fill text-brand-500 text-sm" aria-hidden="true"></i>
                  Privacy Policy &amp; Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h5 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3 font-semibold">
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
        <div className="mt-10 pt-6 border-t border-[#221215]/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-4">
          <p>© {new Date().getFullYear()} SHRELL Automotive India Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>GSTIN: 27AABCV1234F1Z8</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <i className="bi bi-credit-card-2-front" aria-hidden="true"></i>
              Direct UPI &amp; COD Supported
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
