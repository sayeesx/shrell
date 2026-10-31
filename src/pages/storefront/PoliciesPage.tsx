import React from 'react';
import { useLocation } from 'react-router-dom';
import { Truck, RefreshCw, ShieldCheck } from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-slate-300 text-sm leading-relaxed">
      {/* 1. Shipping Policy */}
      {(path === '/shipping-policy' || path === '/policies') && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-surface-800 pb-3">
            <div className="p-2 rounded bg-surface-900 border border-surface-700 text-brand-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono">
                Shipping & Surface Freight Policy
              </h1>
              <p className="text-xs text-slate-400">Fulfilment and transit standards across India</p>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-surface-900 border border-surface-700 space-y-4">
            <h2 className="text-base font-bold text-slate-100">Carrier Partners & Dispatch</h2>
            <p>
              All orders are inspected and dispatched from our primary central fulfilment warehouse in Chakan Industrial Corridor, Pune. Consignments are transported via registered surface express carriers including BlueDart Express, Delhivery Surface, and DTDC Priority.
            </p>

            <h2 className="text-base font-bold text-slate-100">Estimated Delivery Timelines</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 font-mono">
              <li>Maharashtra, Goa, Gujarat: 2 to 3 Business Days.</li>
              <li>Karnataka, Tamil Nadu, Telangana, Andhra Pradesh: 3 to 4 Business Days.</li>
              <li>Delhi NCR, Punjab, Haryana, Rajasthan, Uttar Pradesh: 3 to 5 Business Days.</li>
              <li>Eastern & North-Eastern States, Jammu & Kashmir: 5 to 7 Business Days.</li>
            </ul>

            <h2 className="text-base font-bold text-slate-100">Free Express Shipping Threshold</h2>
            <p>
              Orders exceeding ₹4,999.00 qualify for 100% Free Express Shipping. Standard surface freight for orders below this threshold is calculated at a flat ₹250.00 across India.
            </p>
          </div>
        </section>
      )}

      {/* 2. Returns Policy */}
      {(path === '/returns-policy' || path === '/policies') && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-surface-800 pb-3">
            <div className="p-2 rounded bg-surface-900 border border-surface-700 text-brand-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono">
                7-Day Fitment Guarantee & Returns
              </h1>
              <p className="text-xs text-slate-400">Peace of mind fitment verification</p>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-surface-900 border border-surface-700 space-y-4">
            <h2 className="text-base font-bold text-slate-100">Fitment Guarantee Terms</h2>
            <p>
              We guarantee that model-specific accessories will cleanly install into your selected vehicle variant. If a part does not match your confirmed make, model, or year, we provide a 100% free return pickup and replacement.
            </p>

            <h2 className="text-base font-bold text-slate-100">Return Window</h2>
            <p>
              Customers must initiate return or exchange requests within 7 calendar days of delivery handover. Products must be uninstalled, in original factory packaging, with all hardware brackets and keys intact.
            </p>
          </div>
        </section>
      )}

      {/* 3. Privacy Policy */}
      {(path === '/privacy-policy' || path === '/policies') && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-surface-800 pb-3">
            <div className="p-2 rounded bg-surface-900 border border-surface-700 text-brand-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono">
                Privacy & Data Security Policy
              </h1>
              <p className="text-xs text-slate-400">Customer confidentiality and encryption</p>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-surface-900 border border-surface-700 space-y-4">
            <h2 className="text-base font-bold text-slate-100">Zero Selling of Personal Data</h2>
            <p>
              SHRELL Automotive does not rent, sell, or trade your phone numbers, emails, or delivery addresses to third-party telemarketers or advertisers. Customer data is strictly utilized for order fulfilment, delivery communications, and warranty tracking.
            </p>

            <h2 className="text-base font-bold text-slate-100">Financial Data Protection</h2>
            <p>
              We do not store bank account passwords, debit/credit card CVVs, or UPI PINs. All financial verification is processed through encrypted banking channels and verified via unique UTR transaction identifiers.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};
