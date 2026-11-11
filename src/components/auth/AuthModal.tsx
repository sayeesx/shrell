import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/AuthContext';
import { useTheme } from '../../application/ThemeContext';
import { useBodyScrollLock } from '../common/useBodyScrollLock';
import { ThemeSuccessAnimation, ThemeErrorAnimation } from '../common/ThemeFeedbackAnimation';
import { ShrellLoader } from '../common/ShrellLoader';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithPhone } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useBodyScrollLock(isAuthModalOpen);

  const [step, setStep] = useState<'phone' | 'otp' | 'success' | 'error'>('phone');
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

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    setErrorMessage('');

    // If '0000' is entered, trigger error state to demonstrate ThemeErrorAnimation
    if (code === '0000') {
      setTimeout(() => {
        setIsVerifying(false);
        setErrorMessage('Invalid verification code entered.');
        setStep('error');
      }, 500);
      return;
    }

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 w-screen h-screen min-h-screen bg-black/75 backdrop-blur-md transition-opacity duration-300 pointer-events-auto"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Modal Container: Elevated above virtual keyboard on mobile */}
      <div
        className={`relative w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-8 z-10 transition-all duration-300 ease-out my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto ${
          isDark
            ? 'bg-[#0E0A0B] text-[#F1EEEE] border border-[#261619] shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
            : 'bg-[#FFFEFA] text-[#140E10] border border-[#E0DBD2] shadow-[0_25px_60px_rgba(0,0,0,0.12)]'
        }`}
        style={{
          transform: keyboardOffset > 0 ? `translateY(-${Math.min(keyboardOffset * 0.45, 140)}px)` : undefined,
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Indicator Bar */}
        <div className={`w-10 h-1 rounded-full mx-auto mb-4 sm:hidden ${isDark ? 'bg-[#261619]' : 'bg-[#E0DBD2]'}`} />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className={`absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isDark
              ? 'text-[#8E8587] hover:text-[#F1EEEE] hover:bg-[#1A1214]'
              : 'text-[#5C5456] hover:text-[#140E10] hover:bg-[#EDE9E1]'
          }`}
          aria-label="Close modal"
        >
          <i className="bi bi-x-lg text-sm" aria-hidden="true" />
        </button>

        {/* ======================================================== */}
        {/* STEP 1: PHONE NUMBER INPUT (LOGIN MODAL)                  */}
        {/* ======================================================== */}
        {step === 'phone' && (
          <div className="space-y-5 pt-1">
            {/* SHRELL Brand Logo for both Light & Dark Theme */}
            <div className="flex justify-center pb-1">
              <img
                src={isDark ? '/logos/shrell-logo-white.png' : '/logos/shrell-blacktext-redlogo.png'}
                alt="SHRELL"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>

            <div>
              <h2 className={`text-xl sm:text-2xl font-semibold tracking-tight font-sans ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                Enter your phone number
              </h2>
              <p className={`text-xs sm:text-sm mt-1 font-sans ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                We'll text you a 4-digit code to verify your phone.
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="auth-phone-input" className={`block text-xs font-medium mb-1.5 font-sans ${isDark ? 'text-[#D8D1D1]' : 'text-[#3A3030]'}`}>
                  Phone Number
                </label>
                <div className={`flex rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-[#FF000E] focus-within:border-[#FF000E] transition-all ${
                  isDark ? 'border-[#261619] bg-[#130E10]' : 'border-[#E0DBD2] bg-[#FFFFFF]'
                }`}>
                  <div className={`flex items-center px-4 text-xs font-medium border-r select-none ${
                    isDark ? 'bg-[#1A1214] text-[#D8D1D1] border-[#261619]' : 'bg-[#F5F3EE] text-[#3A3030] border-[#E0DBD2]'
                  }`}>
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
                    className={`w-full px-4 py-3 text-sm bg-transparent focus:outline-none tracking-wider font-sans font-medium ${
                      isDark ? 'text-[#F1EEEE] placeholder-[#5C5456]' : 'text-[#140E10] placeholder-[#9E9898]'
                    }`}
                    maxLength={14}
                  />
                </div>
                {errorMessage && (
                  <p className="text-xs text-[#FF2E3A] mt-1.5 font-medium">{errorMessage}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-sm transition-all active:scale-98 cursor-pointer font-sans"
              >
                Send Verification Code
              </button>
            </form>

            <p className={`text-[11px] text-center leading-relaxed font-sans ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
              By continuing, you agree to SHRELL Automotive's{' '}
              <a href="/privacy-policy" className={`underline ${isDark ? 'hover:text-[#F1EEEE]' : 'hover:text-[#140E10]'}`}>
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/shipping-policy" className={`underline ${isDark ? 'hover:text-[#F1EEEE]' : 'hover:text-[#140E10]'}`}>
                Terms of Service
              </a>
              .
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: 4-DIGIT CODE INPUT (VERIFY MODAL — NO LOGO)       */}
        {/* ======================================================== */}
        {step === 'otp' && (
          <div className="space-y-6 pt-2">
            <div>
              <h2 className={`text-xl sm:text-2xl font-semibold tracking-tight font-sans ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                Verify phone number
              </h2>
              <p className={`text-xs sm:text-sm mt-1 font-sans ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                Enter the 4-digit code sent to{' '}
                <span className={`font-medium ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                  +91 {phoneNumber.replace(/\D/g, '')}
                </span>
                .{' '}
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-[#FF000E] font-medium hover:underline cursor-pointer"
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
                    isDark
                      ? otp[index]
                        ? 'border-[#B0000A] bg-[#1A1214] text-[#F1EEEE]'
                        : 'border-[#261619] bg-[#130E10] text-[#F1EEEE] hover:border-[#4F242C]'
                      : otp[index]
                        ? 'border-[#FF000E] bg-[#FFFFFF] text-[#140E10] shadow-sm'
                        : 'border-[#E0DBD2] bg-[#F5F3EE] text-[#140E10] hover:border-[#C8C2B6]'
                  } focus:border-[#FF000E] ${isDark ? 'focus:bg-[#1A1214]' : 'focus:bg-[#FFFFFF]'} focus:ring-2 focus:ring-[#FF000E]/20`}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {errorMessage && (
              <p className="text-xs text-center text-[#FF2E3A] font-medium">{errorMessage}</p>
            )}

            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-3">
                <ShrellLoader size={40} />
              </div>
            ) : (
              <div className="text-center pt-1">
                <p className={`text-xs font-sans ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#FF000E] font-medium hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                </p>
              </div>
            )}

            <div className="pt-2">
              <p className={`text-[11px] text-center font-sans ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                Tip: Enter any 4 numbers for instant access.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: SUCCESSFUL (THEME-AWARE SUCCESS MODAL)            */}
        {/* ======================================================== */}
        {step === 'success' && (
          <div className="space-y-6 pt-4 pb-2 text-center">
            {/* Editorial Crimson-to-Black Success Animation */}
            <div className="flex justify-center">
              <ThemeSuccessAnimation size={105} />
            </div>

            <div className="space-y-1">
              <h2 className={`text-2xl font-semibold tracking-tight font-sans ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                Successful
              </h2>
              <p className={`text-xs sm:text-sm max-w-[260px] mx-auto leading-relaxed font-sans ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                Your New Experience is successfully added.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDone}
              className="w-full py-3.5 px-6 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-sm transition-all cursor-pointer font-sans"
            >
              Done
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: ERROR STATE                                       */}
        {/* ======================================================== */}
        {step === 'error' && (
          <div className="space-y-6 pt-4 pb-2 text-center">
            <div className="flex justify-center">
              <ThemeErrorAnimation size={105} />
            </div>

            <div className="space-y-1">
              <h2 className={`text-2xl font-semibold tracking-tight font-sans ${isDark ? 'text-[#F1EEEE]' : 'text-[#140E10]'}`}>
                Verification Failed
              </h2>
              <p className={`text-xs sm:text-sm max-w-[260px] mx-auto leading-relaxed font-sans ${isDark ? 'text-[#8E8587]' : 'text-[#5C5456]'}`}>
                {errorMessage || 'The code entered could not be verified. Please try again.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOtp(['', '', '', '']);
                setStep('otp');
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-[#FF000E] hover:bg-[#E0000C] text-white font-medium text-sm transition-all cursor-pointer font-sans"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
