import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useBodyScrollLock } from '../common/useBodyScrollLock';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  useBodyScrollLock(isAuthModalOpen);

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Reset when modal opens/closes
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtp(['', '', '', '']);
      setIsVerifying(false);
      setErrorMessage('');
    }
  }, [isAuthModalOpen]);

  // Auto-focus first input on entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
      }, 150);
    }
  }, [step]);

  if (!isAuthModalOpen) return null;

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMessage('');
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const char = cleanVal.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto advance to next box
    if (char && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }

    // Check if all 4 digits are filled
    const fullCode = newOtp.join('');
    if (fullCode.length === 4) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const newOtp = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    if (pasted.length === 4) {
      verifyCode(pasted);
    } else {
      inputRefs[Math.min(pasted.length, 3)]?.current?.focus();
    }
  };

  const verifyCode = (_code: string) => {
    setIsVerifying(true);
    setErrorMessage('');

    // Default accepted code is 1234 or any 4-digit code provided
    setTimeout(() => {
      setIsVerifying(false);
      setStep('success');
    }, 400);
  };

  const handleDone = async () => {
    await loginWithPhone(phoneNumber || '9876543210');
    closeAuthModal();
    navigate('/profile');
  };

  const handleResend = () => {
    setOtp(['', '', '', '']);
    setErrorMessage('New code sent to your phone.');
    setTimeout(() => setErrorMessage(''), 2500);
    inputRefs[0]?.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Modal / Bottom Drawer Container */}
      <div
        className="relative w-full sm:max-w-md bg-white text-gray-900 rounded-t-[28px] sm:rounded-3xl p-6 sm:p-8 z-10 shadow-2xl transition-all duration-300 ease-out animate-slide-up sm:animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <i className="bi bi-x-lg text-base" aria-hidden="true" />
        </button>

        {/* ======================================================== */}
        {/* STEP 1: PHONE NUMBER INPUT                               */}
        {/* ======================================================== */}
        {step === 'phone' && (
          <div className="space-y-6 pt-2">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-950 tracking-tight font-sans">
                Enter your number
              </h2>
              <p className="text-xs text-gray-500 font-sans">
                Access your profile, track shipments, and view past orders.
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <div className="flex items-center rounded-2xl border-2 border-gray-200 bg-gray-50/80 px-4 py-3 focus-within:border-brand-500 focus-within:bg-white transition-all">
                <span className="text-sm font-bold text-gray-700 pr-3 border-r border-gray-200 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  autoFocus
                  className="w-full pl-3 bg-transparent text-gray-900 placeholder:text-gray-400 font-medium text-base focus:outline-none"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-brand-600 font-medium text-center">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={phoneNumber.length !== 10}
                className="w-full py-3.5 px-6 rounded-full bg-[#1F242F] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: VERIFICATION (Matching Image Reference)          */}
        {/* ======================================================== */}
        {step === 'otp' && (
          <div className="space-y-6 pt-2">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-950 tracking-tight font-sans">
                Let's verify your number
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto leading-relaxed font-sans">
                We've sent a 4-digit code to your phone. It'll auto-verify once entered.
              </p>
            </div>

            {/* 4 Digit Boxes */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all duration-150 focus:outline-none ${
                    digit
                      ? 'border-brand-500 bg-white text-gray-950'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-brand-500 focus:bg-white'
                  }`}
                />
              ))}
            </div>

            {isVerifying && (
              <p className="text-xs text-brand-600 font-medium text-center animate-pulse">
                Verifying code...
              </p>
            )}

            {errorMessage && (
              <p className="text-xs text-emerald-600 font-medium text-center">{errorMessage}</p>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-gray-950 hover:underline cursor-pointer"
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: SUCCESSFUL (Matching Image 1 Reference)          */}
        {/* ======================================================== */}
        {step === 'success' && (
          <div className="space-y-6 pt-4 pb-2 text-center">
            {/* Scalloped Green Badge with Checkmark */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* 12-pointed scalloped flower / star shape */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-20 h-20 text-[#B4F094] fill-current"
                  aria-hidden="true"
                >
                  <path d="M50 0 C54 7 60 7 66 3 C72 10 77 12 83 9 C87 17 92 21 97 20 C98 28 101 34 100 42 C103 48 103 54 100 60 C101 68 98 74 97 82 C92 81 87 85 83 93 C77 90 72 92 66 99 C60 95 54 95 50 100 C46 95 40 95 34 99 C28 92 23 90 17 93 C13 85 8 81 3 82 C2 74 -1 68 0 60 C-3 54 -3 48 0 42 C-1 34 2 28 3 20 C8 21 13 17 17 9 C23 12 28 10 34 3 C40 7 46 7 50 0 Z" />
                </svg>
                {/* Bold Checkmark */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E4620"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute w-9 h-9"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-950 tracking-tight font-sans">
                Successful
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed font-sans">
                Your New Experience is successfully added.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDone}
              className="w-full py-3.5 px-6 rounded-full bg-[#1F242F] hover:bg-black text-white font-semibold text-sm transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
