import React, { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { settingsRepository } from '../../infrastructure/repositories';
import { paisaToRupees, rupeesToPaisa } from '../../domain/services/CurrencyService';

export const AdminSettings: React.FC = () => {
  const [storeName, setStoreName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeUpiId, setStoreUpiId] = useState('');
  const [storeUpiName, setStoreUpiName] = useState('');
  const [freeShippingRupees, setFreeShippingRupees] = useState('');
  const [standardShippingRupees, setStandardShippingRupees] = useState('');
  const [gstRate, setGstRate] = useState('');

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await settingsRepository.getSettings();
        setStoreName(s.storeName);
        setContactEmail(s.contactEmail);
        setContactPhone(s.contactPhone);
        setWhatsappNumber(s.whatsappSupportNumber);
        setStoreUpiId(s.storeUpiId);
        setStoreUpiName(s.storeUpiName);
        setFreeShippingRupees(paisaToRupees(s.freeShippingThresholdPaisa).toString());
        setStandardShippingRupees(paisaToRupees(s.standardShippingPaisa).toString());
        setGstRate(s.gstRatePercent.toString());
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsRepository.updateSettings({
        storeName,
        contactEmail,
        contactPhone,
        whatsappSupportNumber: whatsappNumber,
        storeUpiId,
        storeUpiName,
        freeShippingThresholdPaisa: rupeesToPaisa(Number(freeShippingRupees)),
        standardShippingPaisa: rupeesToPaisa(Number(standardShippingRupees)),
        gstRatePercent: Number(gstRate),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <ShrellLoader size={56} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-surface-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-tight">
          COMMERCE SETTINGS & TAX RULES
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Store parameters, UPI payment handles, GST rates and shipping rules
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Store settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-lg bg-surface-900 border border-surface-700 space-y-6 text-xs font-mono">
        {/* Brand Information */}
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-slate-300 font-bold border-b border-surface-800 pb-2">
            Store Identity & Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Support Phone</label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">
                WhatsApp Support Number (E.164 no +)
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* UPI Payments */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs uppercase tracking-wider text-slate-300 font-bold border-b border-surface-800 pb-2">
            Direct UPI Payment Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Store UPI VPA Handle</label>
              <input
                type="text"
                required
                value={storeUpiId}
                onChange={(e) => setStoreUpiId(e.target.value)}
                placeholder="e.g. shrell@icici"
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Registered Merchant Name</label>
              <input
                type="text"
                required
                value={storeUpiName}
                onChange={(e) => setStoreUpiName(e.target.value)}
                placeholder="e.g. SHRELL Automotive India Pvt Ltd"
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Shipping & GST */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs uppercase tracking-wider text-slate-300 font-bold border-b border-surface-800 pb-2">
            Shipping Thresholds & Tax Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Free Shipping Min (INR)</label>
              <input
                type="number"
                required
                value={freeShippingRupees}
                onChange={(e) => setFreeShippingRupees(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Standard Shipping Fee (INR)</label>
              <input
                type="number"
                required
                value={standardShippingRupees}
                onChange={(e) => setStandardShippingRupees(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Applicable GST Rate (%)</label>
              <input
                type="number"
                required
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
