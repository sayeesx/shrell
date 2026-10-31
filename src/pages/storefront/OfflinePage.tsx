import React, { useState } from 'react';
import { ShrellLoader } from '../../components/common/ShrellLoader';

interface OfflinePageProps {
  onRetry?: () => void;
}

export const OfflinePage: React.FC<OfflinePageProps> = ({ onRetry }) => {
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRetry = async () => {
    setChecking(true);
    setNotice(null);

    // Probe network with a timestamped request to a local static asset
    try {
      const response = await fetch(`/favicon.ico?_probe=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });

      if (response.ok || navigator.onLine) {
        if (onRetry) {
          onRetry();
        } else {
          window.location.reload();
        }
        return;
      }
    } catch {
      // Still offline
    }

    setTimeout(() => {
      setChecking(false);
      setNotice('Still offline. Please verify your connection.');
      setTimeout(() => setNotice(null), 3000);
    }, 600);
  };

  return (
    <main
      className="min-h-screen bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE] flex flex-col items-center justify-center p-6 text-center select-none"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-7 animate-fadeIn">
        {/* Offline Red Icon (Exact match to reference brandicon emblem) */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          <img
            src="/logos/shrell-brandicon_no-bg.png"
            alt="Shrell Offline"
            className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(255,0,14,0.22)]"
            draggable={false}
          />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1EEEE] tracking-tight">
            You’re offline
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8587] max-w-xs sm:max-w-sm mx-auto leading-relaxed">
            Check your Wi-Fi or mobile data, then try again.
          </p>
        </div>

        {/* Retry Button */}
        <div className="pt-2 flex flex-col items-center">
          <button
            type="button"
            onClick={handleRetry}
            disabled={checking}
            className="inline-flex items-center justify-center min-w-[136px] h-10 px-8 rounded-full border border-[#2F2729] bg-[#140E10] hover:bg-[#1C1417] text-xs sm:text-sm font-medium text-[#F1EEEE] hover:text-white transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-75"
          >
            {checking ? (
              <ShrellLoader size={22} />
            ) : (
              'Try again'
            )}
          </button>

          {notice && (
            <p className="text-xs text-[#FF2E3A] mt-3 font-medium animate-fadeIn">
              {notice}
            </p>
          )}
        </div>
      </div>
    </main>
  );
};
