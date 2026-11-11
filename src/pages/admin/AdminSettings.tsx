import React, { useEffect, useState } from 'react';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { settingsRepository } from '../../infrastructure/repositories';
import { paisaToRupees, rupeesToPaisa } from '../../domain/services/CurrencyService';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { useTheme } from '../../application/ThemeContext';

export const AdminSettings: React.FC = () => {
  const { finishPageLoad } = useNavigationLoading();
  const { isDark } = useTheme();
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
        finishPageLoad();
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

  const inputCls = `w-full border rounded-lg px-3 py-2 transition-colors focus:outline-none ${
    isDark
      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
  }`;
  const labelCls = `block uppercase mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`;
  const sectionHeadCls = `text-xs uppercase tracking-wider font-bold border-b pb-2 ${isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-200'}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          COMMERCE SETTINGS & TAX RULES
        </h1>
        <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Store parameters, UPI payment handles, GST rates and shipping rules
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <i className="bi bi-check-lg text-sm" aria-hidden="true" />
          <span>Store settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className={`p-6 rounded-xl border space-y-6 text-xs font-mono shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="space-y-4">
          <h2 className={sectionHeadCls}>Store Identity &amp; Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Store Name', type: 'text', value: storeName, onChange: setStoreName },
              { label: 'Contact Email', type: 'email', value: contactEmail, onChange: setContactEmail },
              { label: 'Support Phone', type: 'text', value: contactPhone, onChange: setContactPhone },
              { label: 'WhatsApp Support Number (E.164 no +)', type: 'text', value: whatsappNumber, onChange: setWhatsappNumber },
            ].map((field) => (
              <div key={field.label}>
                <label className={labelCls}>{field.label}</label>
                <input type={field.type} required value={field.value}
                  onChange={(e) => field.onChange(e.target.value)} className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className={sectionHeadCls}>Direct UPI Payment Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Store UPI VPA Handle</label>
              <input type="text" required value={storeUpiId} onChange={(e) => setStoreUpiId(e.target.value)}
                placeholder="e.g. shrell@icici" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Registered Merchant Name</label>
              <input type="text" required value={storeUpiName} onChange={(e) => setStoreUpiName(e.target.value)}
                placeholder="e.g. SHRELL Automotive India Pvt Ltd" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className={sectionHeadCls}>Shipping Thresholds &amp; Tax Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Free Shipping Min (INR)</label>
              <input type="number" required value={freeShippingRupees} onChange={(e) => setFreeShippingRupees(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Standard Shipping Fee (INR)</label>
              <input type="number" required value={standardShippingRupees} onChange={(e) => setStandardShippingRupees(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Applicable GST Rate (%)</label>
              <input type="number" required value={gstRate} onChange={(e) => setGstRate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button type="submit"
            className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-sm">
            <i className="bi bi-floppy text-sm" aria-hidden="true" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
