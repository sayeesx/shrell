import React, { useState } from 'react';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { useTheme } from '../../application/ThemeContext';

interface OfflinePageProps {
  onRetry?: () => void;
}

export const OfflinePage: React.FC<OfflinePageProps> = ({ onRetry }) => {
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { isDark } = useTheme();

  const handleRetry = async () => {
    setChecking(true);
    setNotice(null);

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
      className={`min-h-screen flex flex-col items-center justify-center p-6 text-center select-none transition-colors duration-300 ${isDark ? 'bg-[#0A0808] bg-atmospheric-red text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-7">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          <ShrellLoader size={120} />
        </div>

        <div className="space-y-2">
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
            You are offline
          </h1>
          <p className={`text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto leading-relaxed ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
            Check your Wi-Fi or mobile data, then try again.
          </p>
        </div>

        <div className="pt-2 flex flex-col items-center">
          <button
            type="button"
            onClick={handleRetry}
            disabled={checking}
            className={`inline-flex items-center justify-center min-w-[136px] h-10 px-8 rounded-full border text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer disabled:opacity-75 ${isDark ? 'border-[#2F2729] bg-[#140E10] hover:bg-[#1C1417] text-[#F1EEEE] hover:text-white' : 'border-[#E0DBD2] bg-white hover:bg-[#F5F3EE] text-[#140E10]'}`}
          >
            {checking ? 'Checking...' : 'Try again'}
          </button>

          {notice && (
            <p className="text-xs text-[#FF2E3A] mt-3 font-medium">
              {notice}
            </p>
          )}
        </div>
      </div>
    </main>
  );
};
