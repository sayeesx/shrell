import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

export const PoliciesPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();

  useEffect(() => {
    finishPageLoad();
  }, [finishPageLoad]);

  const sectionCls = `p-6 rounded-lg border space-y-4 ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`;
  const headingCls = `text-base font-bold ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`;
  const bodyCls = isDark ? 'text-slate-300' : 'text-[#3A3030]';

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#3A3030]'}`}>
      {/* 1. Shipping Policy */}
      {(path === '/shipping-policy' || path === '/policies') && (
        <section className="space-y-4">
          <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
            <div className={`p-2 rounded border text-brand-500 ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
                Shipping & Surface Freight Policy
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Fulfilment and transit standards across India</p>
            </div>
          </div>
          <div className={sectionCls}>
            <h2 className={headingCls}>Carrier Partners & Dispatch</h2>
            <p className={bodyCls}>All orders are inspected and dispatched from our primary central fulfilment warehouse in Chakan Industrial Corridor, Pune. Consignments are transported via registered surface express carriers including BlueDart Express, Delhivery Surface, and DTDC Priority.</p>
            <h2 className={headingCls}>Estimated Delivery Timelines</h2>
            <ul className={`list-disc pl-5 space-y-1.5 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              <li>Maharashtra, Goa, Gujarat: 2 to 3 Business Days.</li>
              <li>Karnataka, Tamil Nadu, Telangana, Andhra Pradesh: 3 to 4 Business Days.</li>
              <li>Delhi NCR, Punjab, Haryana, Rajasthan, Uttar Pradesh: 3 to 5 Business Days.</li>
              <li>Eastern & North-Eastern States, Jammu & Kashmir: 5 to 7 Business Days.</li>
            </ul>
            <h2 className={headingCls}>Free Express Shipping Threshold</h2>
            <p className={bodyCls}>Orders exceeding ₹4,999.00 qualify for 100% Free Express Shipping. Standard surface freight for orders below this threshold is calculated at a flat ₹250.00 across India.</p>
          </div>
        </section>
      )}

      {/* 2. Returns Policy */}
      {(path === '/returns-policy' || path === '/policies') && (
        <section className="space-y-4">
          <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
            <div className={`p-2 rounded border text-brand-500 ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
                7-Day Fitment Guarantee & Returns
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Peace of mind fitment verification</p>
            </div>
          </div>
          <div className={sectionCls}>
            <h2 className={headingCls}>Fitment Guarantee Terms</h2>
            <p className={bodyCls}>We guarantee that model-specific accessories will cleanly install into your selected vehicle variant. If a part does not match your confirmed make, model, or year, we provide a 100% free return pickup and replacement.</p>
            <h2 className={headingCls}>Return Window</h2>
            <p className={bodyCls}>Customers must initiate return or exchange requests within 7 calendar days of delivery handover. Products must be uninstalled, in original factory packaging, with all hardware brackets and keys intact.</p>
          </div>
        </section>
      )}

      {/* 3. Privacy Policy */}
      {(path === '/privacy-policy' || path === '/policies') && (
        <section className="space-y-4">
          <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
            <div className={`p-2 rounded border text-brand-500 ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
                Privacy & Data Security Policy
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>Customer confidentiality and encryption</p>
            </div>
          </div>
          <div className={sectionCls}>
            <h2 className={headingCls}>Zero Selling of Personal Data</h2>
            <p className={bodyCls}>SHRELL Automotive does not rent, sell, or trade your phone numbers, emails, or delivery addresses to third-party telemarketers or advertisers. Customer data is strictly utilized for order fulfilment, delivery communications, and warranty tracking.</p>
            <h2 className={headingCls}>Financial Data Protection</h2>
            <p className={bodyCls}>We do not store bank account passwords, debit/credit card CVVs, or UPI PINs. All financial verification is processed through encrypted banking channels and verified via unique UTR transaction identifiers.</p>
          </div>
        </section>
      )}
    </div>
  );
};
