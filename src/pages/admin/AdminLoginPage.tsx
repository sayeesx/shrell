import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ShrellLoader } from '../../components/common/ShrellLoader';
import { SEOHead } from '../../infrastructure/seo/SEOHead';

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginAsAdmin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await loginAsAdmin(password);
    setIsSubmitting(false);

    if (success) {
      navigate('/admin');
    } else {
      setError('Invalid administrative security key. Default development key: shrelladmin2026');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <SEOHead
        title="Admin Sign In | SHRELL Automotive"
        description="Administrative authentication portal."
        noIndex={true}
      />
      {/* Theme toggle top-right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className={`w-full max-w-md rounded-2xl p-8 space-y-6 border shadow-xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 flex items-center justify-center mx-auto">
            <img
              src="/logos/shrell-brandicon_no-bg.png"
              alt="SHRELL"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className={`text-lg font-bold font-mono tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            SHRELL OPERATIONS CONSOLE
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Internal administrative gateway for inventory & order dispatch
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs font-mono text-rose-500 flex items-center gap-2">
            <i className="bi bi-exclamation-circle flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-key" className={`block text-xs font-mono uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Administrative Passkey
            </label>
            <div className="relative">
              <i className={`bi bi-lock text-sm absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} aria-hidden="true" />
              <input
                id="admin-key"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin security key..."
                className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs font-mono transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-slate-800'
                }`}
              />
            </div>
            <div className={`text-[10px] font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              For initial development setup, use: <code className="text-slate-500 dark:text-slate-300 font-bold">shrelladmin2026</code>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 disabled:opacity-50 font-bold text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isSubmitting ? (
              <><ShrellLoader size={18} white /><span>Authenticating...</span></>
            ) : (
              'Authorize Session'
            )}
          </button>
        </form>

        <div className={`text-center pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <Link
            to="/"
            className={`text-xs font-mono transition-colors inline-flex items-center gap-2 group cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            aria-label="SHRELL Storefront"
          >
            <img
              src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'}
              alt="SHRELL"
              className={`w-auto object-contain ${isDark ? 'h-4' : 'h-[18px]'}`}
            />
            <span>Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
