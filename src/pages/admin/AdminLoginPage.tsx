import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ShrellLoader } from '../../components/common/ShrellLoader';

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
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-surface-950' : 'bg-[#FFFEFA]'}`}>
      {/* Theme toggle top-right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className={`w-full max-w-md rounded-lg p-8 space-y-6 border ${isDark ? 'bg-surface-900 border-surface-700' : 'bg-white border-[#E0DBD2]'}`}>
        <div className="text-center space-y-3">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto p-2.5 ${isDark ? 'bg-surface-950 border-surface-700' : 'bg-[#F5F3EE] border-[#E0DBD2]'}`}>
            <img
              src="/logos/shrell-brandicon_no-bg.png"
              alt="SHRELL"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className={`text-xl font-bold font-mono tracking-wider ${isDark ? 'text-slate-100' : 'text-[#140E10]'}`}>
            SHRELL OPERATIONS CONSOLE
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
            Internal administrative gateway for inventory & order dispatch
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-key" className={`block text-xs font-mono uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-[#5C5456]'}`}>
              Administrative Passkey
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`} />
              <input
                id="admin-key"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin security key..."
                className={`w-full border rounded pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-500 ${isDark ? 'bg-surface-950 border-surface-700 text-slate-100' : 'bg-[#F5F3EE] border-[#E0DBD2] text-[#140E10]'}`}
              />
            </div>
            <div className={`text-[10px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-[#8E8587]'}`}>
              For initial development setup, use: <code className="text-brand-400">shrelladmin2026</code>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] px-4 py-2.5 rounded bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><ShrellLoader size={18} white /><span>Authenticating...</span></>
            ) : (
              'Authorize Session'
            )}
          </button>
        </form>

        <div className={`text-center pt-2 border-t ${isDark ? 'border-surface-800' : 'border-[#E0DBD2]'}`}>
          <Link
            to="/"
            className={`text-xs font-mono transition-colors inline-flex items-center gap-2 group cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-[#5C5456] hover:text-[#140E10]'}`}
            aria-label="SHRELL Storefront"
          >
            <img
              src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'}
              alt="SHRELL"
              className="h-4 w-auto object-contain"
            />
            <span>Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
