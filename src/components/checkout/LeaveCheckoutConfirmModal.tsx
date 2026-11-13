import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../../application/ThemeContext';
import { useBodyScrollLock } from '../common/useBodyScrollLock';

export interface LeaveCheckoutConfirmModalProps {
  isOpen: boolean;
  onContinueOrder: () => void;
  onConfirmLeave: () => void;
  itemName?: string;
}

/**
 * Confirmation modal shown when user clicks Back on Cart, Delivery Address, or Payment Method.
 * Anchors sad-cat art resting against the content margin inside a desktop popup or mobile bottom sheet.
 * Enhanced with motion.dev buttery spring animations.
 */
export const LeaveCheckoutConfirmModal: React.FC<LeaveCheckoutConfirmModalProps> = ({
  isOpen,
  onContinueOrder,
  onConfirmLeave,
  itemName,
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-checkout-title"
          className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto overscroll-contain"
        >
          <motion.div
            key="leave-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 modal-backdrop-solid"
            onClick={onContinueOrder}
            aria-hidden="true"
          />

          <motion.div
            key="leave-sheet"
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-5 sm:p-6 pb-6 text-left overflow-hidden ${
              isDark
                ? 'bg-[#0A0A0A] border-[#261619] text-[#F1EEEE]'
                : 'bg-white border-[#E0DBD2] text-[#140E10]'
            }`}
          >
            {/* Drag pill indicator for mobile bottom sheet */}
            <div className="md:hidden w-10 h-1 rounded-full bg-current opacity-20 mx-auto mb-3" aria-hidden="true" />

            {/* Title and description spanning full width above the image to fill empty space */}
            <div className="relative z-10 w-full space-y-1.5">
              <h2 id="leave-checkout-title" className="text-lg sm:text-xl font-bold tracking-tight">
                Wait... are you sure you want to leave?
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#A8A0A2]' : 'text-[#5C5456]'}`}>
                {itemName ? `${itemName} is` : 'Your items are'} already queued for dispatch. Do you truly wish to head back and leave your order behind?
              </p>
            </div>

            {/* Action buttons on left, sized clear of default bottom-right cat art */}
            <div className="relative z-10 mt-5 w-[calc(100%-8.5rem)] sm:w-[calc(100%-9.5rem)] max-w-xs flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onContinueOrder}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Complete Order
              </button>
              <button
                type="button"
                onClick={onConfirmLeave}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#2B2B2B] bg-[#141414] hover:bg-[#1E1E1E] text-[#F1EEEE]'
                    : 'border-[#D0C9BE] bg-[#F5F3EE] hover:bg-[#EDE9E1] text-[#140E10]'
                }`}
              >
                I Will Go Back
              </button>
            </div>

            {/* Sad cat image placed at default bottom-right position */}
            <img
              src="/images/cat-sad.webp"
              alt="Sad cat hoping you complete your order"
              className="pointer-events-none select-none absolute right-0 bottom-0 w-32 h-32 sm:w-36 sm:h-36 object-contain object-right-bottom bg-transparent border-0 shadow-none"
              style={{ boxShadow: 'none', background: 'transparent' }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
