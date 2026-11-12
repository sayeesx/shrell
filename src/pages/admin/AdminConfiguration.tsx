import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../application/ThemeContext';
import { useNavigationLoading } from '../../application/NavigationLoadingContext';
import { getRepositoryMode } from '../../infrastructure/repositories';
import { cloudinaryService } from '../../infrastructure/cloudinary/cloudinaryService';
import { getSanityConfig, isSanityConfigured } from '../../infrastructure/sanity/sanityConfig';
import { POSTHOG_CONFIG } from '../../infrastructure/analytics/posthog';
import { SITE_URL } from '../../infrastructure/seo/schemaGenerators';
import { AdminSanity } from './AdminSanity';

export const AdminConfiguration: React.FC = () => {
  const { isDark } = useTheme();
  const { finishPageLoad } = useNavigationLoading();

  useEffect(() => {
    finishPageLoad();
  }, [finishPageLoad]);

  const repoMode = getRepositoryMode();
  const isCloudinaryActive = cloudinaryService.isConfigured();
  const cloudinaryCloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const cloudinaryPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const isSupabaseActive = Boolean(
    supabaseUrl &&
      supabaseUrl !== 'https://your-project.supabase.co' &&
      !supabaseUrl.includes('placeholder')
  );

  const sanityCfg = getSanityConfig();
  const sanityActive = isSanityConfigured();

  const isPostHogActive = Boolean(POSTHOG_CONFIG.apiKey && POSTHOG_CONFIG.apiKey.trim());
  const razorpayKey = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const isRazorpayLive = Boolean(razorpayKey && !razorpayKey.includes('placeholder'));
  const whatsappSupport = (import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || '').trim();

  const cardCls = `p-4 rounded-xl border space-y-2.5 transition-colors ${
    isDark ? 'bg-[#0A0A0A] border-[#222222] text-[#F1EEEE]' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
  }`;

  const badgeCls = (ok: boolean) =>
    `text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
      ok
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
        : isDark
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border-amber-200'
    }`;

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-[#222222]' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            System Configuration &amp; Integrations
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Live database status, Cloudinary free-tier optimization, PostHog analytics, and Sanity CMS controls.
          </p>
        </div>

        <Link
          to="/admin/settings"
          className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-semibold flex items-center gap-2 transition-colors ${
            isDark
              ? 'bg-[#0A0A0A] border-[#222222] text-neutral-200 hover:bg-[#141414]'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="bi bi-gear text-xs" aria-hidden="true" />
          <span>Store Settings &amp; OpenGraph</span>
        </Link>
      </div>

      {/* Infrastructure Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. Database Repository */}
        <div className={cardCls}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <i className="bi bi-database text-sm text-[#FF000E]" aria-hidden="true" />
              <span>Database Engine</span>
            </div>
            <span className={badgeCls(isSupabaseActive || repoMode === 'SANITY_CMS')}>{repoMode}</span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Active repository adapter: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{repoMode}</strong>.{' '}
            {isSupabaseActive
              ? 'Connected to PostgreSQL via VITE_SUPABASE_URL.'
              : 'No external VITE_SUPABASE_URL detected; running with configured CMS / local fallback.'}
          </p>
          <div className={`text-[11px] font-mono truncate pt-1 border-t ${isDark ? 'border-[#1E1E1E] text-neutral-400' : 'border-slate-100 text-slate-500'}`}>
            Supabase Host: {isSupabaseActive ? supabaseUrl : 'Not set in .env'}
          </div>
        </div>

        {/* 2. Cloudinary Media Storage */}
        <div className={cardCls}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <i className="bi bi-cloud-arrow-up text-sm text-[#FF000E]" aria-hidden="true" />
              <span>Cloudinary Media Storage</span>
            </div>
            <span className={badgeCls(isCloudinaryActive)}>
              {isCloudinaryActive ? 'Connected & Active' : 'Not Configured'}
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Client-side crop and WebP compression runs before upload (Products &lt;= 100 KB, Desktop Banners &lt;= 150 KB, Mobile Banners &lt;= 95 KB, OpenGraph 1200x630 JPEG &lt;= 120 KB) to conserve free-tier credits.
          </p>
          <div className={`text-[11px] font-mono truncate pt-1 border-t ${isDark ? 'border-[#1E1E1E] text-neutral-400' : 'border-slate-100 text-slate-500'}`}>
            Cloud: {cloudinaryCloudName || 'Unset'} • Preset: {cloudinaryPreset || 'Unset'}
          </div>
        </div>

        {/* 3. Sanity CMS */}
        <div className={cardCls}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <i className="bi bi-magic text-sm text-[#FF000E]" aria-hidden="true" />
              <span>Sanity Headless CMS</span>
            </div>
            <span className={badgeCls(sanityActive)}>{sanityActive ? 'Configured' : 'Standby'}</span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Manages product catalogue sync, home sections, and hero banner documents. Use the Sanity Hub workspace below to test or push records.
          </p>
          <div className={`text-[11px] font-mono truncate pt-1 border-t ${isDark ? 'border-[#1E1E1E] text-neutral-400' : 'border-slate-100 text-slate-500'}`}>
            Project ID: {sanityCfg.projectId || 'Unset'} • Dataset: {sanityCfg.dataset || 'production'}
          </div>
        </div>

        {/* 4. PostHog Analytics */}
        <div className={cardCls}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <i className="bi bi-bar-chart-line text-sm text-[#FF000E]" aria-hidden="true" />
              <span>PostHog Telemetry</span>
            </div>
            <span className={badgeCls(isPostHogActive)}>{isPostHogActive ? 'Tracking Active' : 'Stub Mode'}</span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Captures pageviews, product impressions, cart actions, checkout steps, and Core Web Vitals safely without throwing when no key is set.
          </p>
          <div className={`text-[11px] font-mono truncate pt-1 border-t ${isDark ? 'border-[#1E1E1E] text-neutral-400' : 'border-slate-100 text-slate-500'}`}>
            Host: {POSTHOG_CONFIG.apiHost} • Key: {isPostHogActive ? `${POSTHOG_CONFIG.apiKey.slice(0, 8)}...` : 'Not set'}
          </div>
        </div>

        {/* 5. Deployment & Social Crawler */}
        <div className={cardCls}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <i className="bi bi-globe2 text-sm text-[#FF000E]" aria-hidden="true" />
              <span>SEO &amp; Social Crawlers</span>
            </div>
            <span className={badgeCls(true)}>Edge Rewrite Ready</span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Serves dynamic OpenGraph meta tags via <code className="text-[11px]">/api/crawler-handler</code> using each product&apos;s first image or custom OpenGraph settings.
          </p>
          <div className={`text-[11px] font-mono truncate pt-1 border-t ${isDark ? 'border-[#1E1E1E] text-neutral-400' : 'border-slate-100 text-slate-500'}`}>
            Canonical Origin: {SITE_URL}
          </div>
        </div>

        {/* 6. Payments & Support */}
        <div className={cardCls}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <i className="bi bi-shield-check text-sm text-[#FF000E]" aria-hidden="true" />
              <span>Checkout &amp; WhatsApp</span>
            </div>
            <span className={badgeCls(isRazorpayLive)}>{isRazorpayLive ? 'Live Keys' : 'Test / UPI Mode'}</span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Supports Direct UPI QR/Intent and Razorpay checkout gateways with automated WhatsApp order support routing.
          </p>
          <div className={`text-[11px] font-mono truncate pt-1 border-t ${isDark ? 'border-[#1E1E1E] text-neutral-400' : 'border-slate-100 text-slate-500'}`}>
            WhatsApp Support: {whatsappSupport || 'Unset'}
          </div>
        </div>
      </div>

      {/* Embedded Sanity CMS Hub */}
      <div className={`p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-[#0A0A0A] border-[#222222]' : 'bg-white border-slate-200 shadow-xs'}`}>
        <AdminSanity embedded />
      </div>
    </div>
  );
};
