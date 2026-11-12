import React from 'react';
import {
  siVisa,
  siMastercard,
  siGooglepay,
  siApplepay,
  siPhonepe,
  siPaytm,
  siRazorpay,
} from 'simple-icons';
import { useTheme } from '../../application/ThemeContext';

/**
 * Renders authentic open-source brand SVG payment icons (UPI, Visa, Mastercard,
 * Google Pay, Apple Pay, PhonePe, Paytm, Razorpay) without placeholder CSS badges.
 */
export const PaymentMethodIcons: React.FC = () => {
  const { isDark } = useTheme();

  const cardContainerCls = `h-7 px-2 rounded-md border inline-flex items-center justify-center transition-colors ${
    isDark
      ? 'bg-[#0F0F0F] border-[#242424] text-[#F1EEEE]'
      : 'bg-white border-[#DED8CE] text-[#140E10]'
  }`;

  const brandIcons = [
    {
      key: 'visa',
      label: 'Visa',
      path: siVisa.path,
      fill: isDark ? '#F1EEEE' : `#${siVisa.hex}`,
    },
    {
      key: 'mastercard',
      label: 'Mastercard',
      path: siMastercard.path,
      fill: `#${siMastercard.hex}`,
    },
    {
      key: 'gpay',
      label: 'Google Pay',
      path: siGooglepay.path,
      fill: isDark ? '#F1EEEE' : `#${siGooglepay.hex}`,
    },
    {
      key: 'applepay',
      label: 'Apple Pay',
      path: siApplepay.path,
      fill: isDark ? '#FFFFFF' : '#000000',
    },
    {
      key: 'phonepe',
      label: 'PhonePe',
      path: siPhonepe.path,
      fill: isDark ? '#A87CE8' : `#${siPhonepe.hex}`,
    },
    {
      key: 'paytm',
      label: 'Paytm',
      path: siPaytm.path,
      fill: isDark ? '#38BDF8' : `#${siPaytm.hex}`,
    },
    {
      key: 'razorpay',
      label: 'Razorpay',
      path: siRazorpay.path,
      fill: isDark ? '#60A5FA' : `#${siRazorpay.hex}`,
    },
  ];

  return (
    <div className="flex items-center flex-wrap gap-1.5" aria-label="Supported payment methods">
      {/* Authentic NPCI UPI Dual-Chevron Mark + Wordmark */}
      <span className={cardContainerCls} title="Unified Payments Interface (UPI)" aria-label="UPI">
        <svg viewBox="0 0 64 24" className="h-4 w-auto" role="img" aria-label="UPI logo">
          <path d="M51.6 3.5L56.8 12L46.4 20.5L49.4 12L51.6 3.5Z" fill="#097939" />
          <path d="M47.4 3.5L52.6 12L42.2 20.5L45.2 12L47.4 3.5Z" fill="#ED752E" />
          <path
            d="M7.5 6.5V13.8C7.5 15.8 8.7 17.2 10.8 17.2C12.9 17.2 14.1 15.8 14.1 13.8V6.5H16.8V13.9C16.8 17.3 14.5 19.6 10.8 19.6C7.1 19.6 4.8 17.3 4.8 13.9V6.5H7.5ZM20.2 6.5H25.2C28.1 6.5 29.8 8 29.8 10.6C29.8 13.2 28.1 14.7 25.2 14.7H22.9V19.3H20.2V6.5ZM22.9 12.5H24.9C26.4 12.5 27.2 11.8 27.2 10.6C27.2 9.4 26.4 8.7 24.9 8.7H22.9V12.5ZM32.3 6.5H35V19.3H32.3V6.5Z"
            fill={isDark ? '#F1EEEE' : '#140E10'}
          />
        </svg>
      </span>

      {brandIcons.map((item) => (
        <span key={item.key} className={cardContainerCls} title={item.label} aria-label={item.label}>
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill={item.fill}
            role="img"
            aria-label={item.label}
          >
            <path d={item.path} />
          </svg>
        </span>
      ))}
    </div>
  );
};
