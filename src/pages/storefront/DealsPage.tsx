import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../application/ThemeContext';

export const DealsPage: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#0A0808] text-[#F1EEEE]' : 'bg-[#FFFEFA] text-[#140E10]'}`}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-xl bg-[#FF000E]/10 flex items-center justify-center">
            <i className="bi bi-tools text-4xl text-[#FF000E]" aria-hidden="true"></i>
          </div>
          
          <h1 className={`text-3xl font-bold ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
            Site Under Development
          </h1>
          
          <p className={`text-base ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
            We're working on bringing you the best deals. Check back soon!
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
