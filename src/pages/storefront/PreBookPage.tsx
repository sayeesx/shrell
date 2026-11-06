import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';

export const PreBookPage: React.FC = () => {
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();

  useEffect(() => {
    window.scrollTo(0, 0);
    finishPageLoad();
  }, [finishPageLoad]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <div className="max-w-md w-full text-center space-y-6 -mt-20">
        <div className="space-y-3">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border shadow-xs ${
            isDark ? 'bg-[#130E10] border-[#261619] text-[#FF000E]' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#FF000E]'
          }`}>
            <i className="bi bi-clock-history text-2xl" aria-hidden="true" />
          </div>

          <h1 className={`text-3xl font-bold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
            Pre-Book Coming Soon
          </h1>
          
          <p className={`text-base ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
            We're setting up the pre-booking system for Ultra Shampoo. Check back soon!
          </p>
        </div>

        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-lg bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-sm transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};
