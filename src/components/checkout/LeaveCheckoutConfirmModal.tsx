import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../application/ThemeContext';
import { useBodyScrollLock } from '../common/useBodyScrollLock';

export interface LeaveCheckoutConfirmModalProps {
  isOpen: boolean;
  onContinueOrder: () => void;
  onConfirmLeave: () => void;
}

/**
 * Confirmation modal shown when user clicks Back on Cart, Delivery Address, or Payment Method.
 * Renders as a bottom-anchored sheet on mobile and centered popup on desktop.
 */
export const LeaveCheckoutConfirmModal: React.FC<LeaveCheckoutConfirmModalProps> = ({
  isOpen,
  onContinueOrder,
  onConfirmLeave,
}) => {
  const { isDark } = useTheme();
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onContinueOrder();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onContinueOrder]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-checkout-title"
      className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto overscroll-contain"
    >
      <div
        className="fixed inset-0 modal-backdrop-solid"
        onClick={onContinueOrder}
        aria-hidden="true"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-5 sm:p-6 pb-7 sm:pb-6 text-center space-y-4 transition-transform ${
          isDark
            ? 'bg-[#0A0A0A] border-[#261619] text-[#F1EEEE]'
            : 'bg-white border-[#E0DBD2] text-[#140E10]'
        }`}
      >
        {/* Drag pill indicator for mobile bottom sheet */}
        <div className="md:hidden w-10 h-1 rounded-full bg-current opacity-20 mx-auto -mt-1" aria-hidden="true" />

        <img
          src="/images/cat-sad.webp"
          alt="Sad cat hoping you complete your order"
          className="w-36 h-36 sm:w-40 sm:h-40 mx-auto object-contain bg-transparent border-0 shadow-none"
          style={{ boxShadow: 'none', background: 'transparent' }}
        />

        <div className="space-y-1.5">
          <h2 id="leave-checkout-title" className="text-lg sm:text-xl font-bold tracking-tight">
            Wait... are you sure you want to leave?
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#A8A0A2]' : 'text-[#5C5456]'}`}>
            Your gear is packed in the bay and even Milo looks heartbroken. Do you truly wish to leave your order behind?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onConfirmLeave}
            className={`w-full sm:w-1/2 py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'border-[#2B2B2B] bg-[#141414] hover:bg-[#1E1E1E] text-[#F1EEEE]'
                : 'border-[#D0C9BE] bg-[#F5F3EE] hover:bg-[#EDE9E1] text-[#140E10]'
            }`}
          >
            I Will Go Back
          </button>
          <button
            type="button"
            onClick={onContinueOrder}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Complete Order
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
