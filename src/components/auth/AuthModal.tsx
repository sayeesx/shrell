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
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Visual Viewport tracking for mobile virtual keyboards so modal sits perfectly above keyboard
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const updateKeyboardOffset = () => {
      if (window.visualViewport) {
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        setKeyboardOffset(offset);
      }
    };

    window.visualViewport?.addEventListener('resize', updateKeyboardOffset);
    window.visualViewport?.addEventListener('scroll', updateKeyboardOffset);
    updateKeyboardOffset();

    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboardOffset);
      window.visualViewport?.removeEventListener('scroll', updateKeyboardOffset);
    };
  }, [isAuthModalOpen]);

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

  const verifyCode = async (_code: string) => {
    setIsVerifying(true);
    setErrorMessage('');

    // Instant verification for customer convenience
    setTimeout(async () => {
      loginWithPhone(`+91${phoneNumber.replace(/\D/g, '')}`);
      setIsVerifying(false);
      setStep('success');
    }, 400);
  };

  const handleDone = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Modal Container: Elevated above virtual keyboard on mobile */}
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-white text-gray-900 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl transition-all duration-300 ease-out my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto"
        style={{
          transform: keyboardOffset > 0 ? `translateY(-${Math.min(keyboardOffset * 0.45, 140)}px)` : undefined,
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Indicator Bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <i className="bi bi-x-lg text-base" aria-hidden="true" />
        </button>

        {/* ======================================================== */}
        {/* STEP 1: PHONE NUMBER INPUT                               */}
        {/* ======================================================== */}
        {step === 'phone' && (
          <div className="space-y-6 pt-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight font-sans">
                Enter your phone number
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-sans">
                We'll text you a 4-digit code to verify your phone.
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="auth-phone-input" className="block text-xs font-semibold text-gray-700 mb-1.5 font-sans">
                  Phone Number
                </label>
                <div className="flex rounded-full border border-gray-300 bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
                  <div className="flex items-center px-4 bg-gray-50 text-gray-600 text-xs font-semibold border-r border-gray-200 select-none">
                    +91
                  </div>
                  <input
                    id="auth-phone-input"
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-gray-900 bg-transparent focus:outline-none tracking-wider font-sans font-medium"
                    maxLength={14}
                  />
                </div>
                {errorMessage && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium">{errorMessage}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-full bg-[#1F242F] hover:bg-black text-white font-semibold text-sm transition-all shadow-sm active:scale-98 cursor-pointer font-sans"
              >
                Send Verification Code
              </button>
            </form>

            <p className="text-[11px] text-gray-500 text-center leading-relaxed font-sans">
              By continuing, you agree to SHRELL Automotive's{' '}
              <a href="/privacy-policy" className="underline hover:text-gray-900">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/shipping-policy" className="underline hover:text-gray-900">
                Terms of Service
              </a>
              .
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: 4-DIGIT CODE INPUT (Matching Image 2 Reference)  */}
        {/* ======================================================== */}
        {step === 'otp' && (
          <div className="space-y-6 pt-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight font-sans">
                Verify phone number
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-sans">
                Enter the 4-digit code sent to{' '}
                <span className="font-semibold text-gray-800">
                  +91 {phoneNumber.replace(/\D/g, '')}
                </span>
                .{' '}
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-brand-600 font-semibold hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </p>
            </div>

            {/* 4 Large Rounded Individual Boxes */}
            <div className="flex justify-center gap-3 sm:gap-4 my-2" onPaste={handlePaste}>
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isVerifying}
                  className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-2xl border transition-all duration-150 focus:outline-none ${
                    otp[index]
                      ? 'border-gray-950 bg-white text-gray-950 shadow-xs'
                      : 'border-gray-300 bg-gray-50 text-gray-900 hover:border-gray-400'
                  } focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10`}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {errorMessage && (
              <p className="text-xs text-center text-rose-600 font-medium">{errorMessage}</p>
            )}

            {isVerifying ? (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-600">
                <i className="bi bi-arrow-repeat animate-spin text-base text-brand-600" />
                <span>Verifying credentials...</span>
              </div>
            ) : (
              <div className="text-center pt-1">
                <p className="text-xs text-gray-500 font-sans">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-brand-600 font-semibold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                </p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-[11px] text-gray-500 text-center font-sans">
                Tip: Enter any 4 numbers for instant access.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: SUCCESSFUL (Safe uncropped scalloped badge)       */}
        {/* ======================================================== */}
        {step === 'success' && (
          <div className="space-y-6 pt-4 pb-2 text-center">
            {/* Scalloped Green Badge with Checkmark - with safe viewBox margin so petals are NEVER cropped */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg
                  viewBox="-14 -14 128 128"
                  className="w-24 h-24 text-[#B4F094] fill-current overflow-visible"
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
                  className="absolute w-10 h-10"
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
              className="w-full py-3.5 px-6 rounded-full bg-[#1F242F] hover:bg-black text-white font-semibold text-sm transition-all cursor-pointer font-sans"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
