import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../application/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginAsAdmin } = useAuth();
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
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-900 border border-surface-700 rounded-lg p-8 shadow-elevation space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-950 border border-surface-700 flex items-center justify-center mx-auto p-2.5 shadow-inner">
            <img
              src="/logos/shrell-brandicon_no-bg.png"
              alt="SHRELL"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-wider">
            SHRELL OPERATIONS CONSOLE
          </h1>
          <p className="text-xs text-slate-400">
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
            <label htmlFor="admin-key" className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Administrative Passkey
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-key"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin security key..."
                className="w-full bg-surface-950 border border-surface-700 rounded pl-9 pr-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              For initial development setup, use: <code className="text-brand-400">shrelladmin2026</code>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] px-4 py-2.5 rounded bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors"
          >
            {isSubmitting ? 'Authenticating...' : 'Authorize Session'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-surface-800">
          <Link
            to="/"
            className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-2 group cursor-pointer"
            aria-label="SHRELL Storefront"
          >
            <img src="/logos/shrell-logo-white.png" alt="SHRELL" className="h-4 w-auto object-contain" />
            <span>Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
