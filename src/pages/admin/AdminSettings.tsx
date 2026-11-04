import React, { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
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

  const inputCls = `w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-500 ${isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-white border-[#E0DBD2] text-[#140E10]'}`;
  const labelCls = `block uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`;
  const sectionHeadCls = `text-xs uppercase tracking-wider font-bold border-b pb-2 ${isDark ? 'text-slate-300 border-surface-800' : 'text-[#3A3030] border-[#E0DBD2]'}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className={`border-b pb-4 ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
        <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
          COMMERCE SETTINGS & TAX RULES
        </h1>
        <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
          Store parameters, UPI payment handles, GST rates and shipping rules
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Store settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className={`p-6 rounded-lg border space-y-6 text-xs font-mono ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
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

        <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
          <button type="submit"
            className="px-6 py-2.5 rounded bg-brand-500 hover:bg-brand-600 text-white font-bold uppercase tracking-wider flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
