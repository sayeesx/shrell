import React, { useId } from 'react';

/**
 * Editorial Crimson & Black Success / Error Animations
 *
 * Timeline (seconds):
 *  0.00 → 1.60  Ring draws clockwise (dashoffset 1.01 → 0)
 *  1.35 → 1.95  Soft fill blooms in (opacity 0 → 1, scale 0.82 → 1)
 *  1.55 → 2.15  Badge pops + glow (scale 1.07 + crimson drop shadow)
 *  1.65 → 2.25  Tick / Cross draws (dashoffset 1.1 → 0)
 *  1.60 → 2.50  Ripple fades out (scale 1.4, opacity 0.5 → 0)
 */

interface FeedbackAnimationProps {
  size?: number;
  className?: string;
}

export const ThemeSuccessAnimation: React.FC<FeedbackAnimationProps> = ({
  size = 120,
  className = '',
}) => {
  const rawId = useId().replace(/:/g, '');
  const gradId = `crimson-succ-grad-${rawId}`;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Action succeeded"
    >
      <div
        className="w-full h-full relative"
        style={{
          animation: 'shrellBadgePop 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both, shrellCrimsonGlow 0.8s ease-out 0.45s both',
        }}
      >
        <svg
          viewBox="0 0 124 124"
          fill="none"
          className="w-full h-full overflow-visible block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="14" y1="14" x2="110" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF000E" />
              <stop offset="45%" stopColor="#E0000C" />
              <stop offset="100%" stopColor="#B0000A" />
            </linearGradient>
          </defs>

          {/* Soft fill blooming inside ring */}
          <circle
            cx={62}
            cy={62}
            r={56}
            fill="#650008"
            style={{
              opacity: 0,
              fillOpacity: 0.22,
              transformOrigin: 'center',
              animation: 'shrellBloom 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both',
            }}
          />

          {/* Quiet background track */}
          <circle
            cx={62}
            cy={62}
            r={59}
            stroke="#260407"
            strokeWidth={5}
            opacity={0.6}
          />

          {/* Progress ring drawn clockwise starting at 12 o'clock */}
          <circle
            cx={62}
            cy={62}
            r={59}
            pathLength={1}
            stroke={`url(#${gradId})`}
            strokeWidth={5}
            strokeLinecap="round"
            transform="rotate(-90 62 62)"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1.01,
              animation: 'shrellDrawRing 0.5s cubic-bezier(0.65, 0, 0.35, 1) both',
            }}
          />

          {/* Subtle ripple released upon completion */}
          <circle
            cx={62}
            cy={62}
            r={59}
            stroke="#FF000E"
            strokeWidth={1.5}
            style={{
              opacity: 0,
              transformOrigin: 'center',
              animation: 'shrellRipple 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both',
            }}
          />

          {/* Elegant checkmark: starts invisible to prevent initial rounded cap dot glitch */}
          <path
            d="M40 64 L55 79 L84 48"
            pathLength={1}
            stroke="#F1EEEE"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: 0,
              strokeDasharray: 1,
              strokeDashoffset: 1.05,
              animation: 'shrellDrawTick 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards',
            }}
          />
        </svg>
      </div>
    </div>
  );
};

export const ThemeErrorAnimation: React.FC<FeedbackAnimationProps> = ({
  size = 120,
  className = '',
}) => {
  const rawId = useId().replace(/:/g, '');
  const gradId = `crimson-err-grad-${rawId}`;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Action failed"
    >
      <div
        className="w-full h-full relative"
        style={{
          animation: 'shrellBadgePop 0.6s cubic-bezier(0.22, 1, 0.36, 1) 1.55s both, shrellErrorGlow 1.1s ease-out 1.55s both',
        }}
      >
        <svg
          viewBox="0 0 124 124"
          fill="none"
          className="w-full h-full overflow-visible block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="14" y1="14" x2="110" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF000E" />
              <stop offset="60%" stopColor="#B0000A" />
              <stop offset="100%" stopColor="#650008" />
            </linearGradient>
          </defs>

          {/* Dark blood red fill bloom */}
          <circle
            cx={62}
            cy={62}
            r={56}
            fill="#380509"
            style={{
              opacity: 0,
              fillOpacity: 0.35,
              transformOrigin: 'center',
              animation: 'shrellBloom 0.6s cubic-bezier(0.22, 1, 0.36, 1) 1.35s both',
            }}
          />

          {/* Deep burgundy track */}
          <circle
            cx={62}
            cy={62}
            r={59}
            stroke="#260407"
            strokeWidth={5}
            opacity={0.6}
          />

          {/* Progress ring drawn clockwise */}
          <circle
            cx={62}
            cy={62}
            r={59}
            pathLength={1}
            stroke={`url(#${gradId})`}
            strokeWidth={5}
            strokeLinecap="round"
            transform="rotate(-90 62 62)"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1.01,
              animation: 'shrellDrawRing 1.6s cubic-bezier(0.65, 0, 0.35, 1) both',
            }}
          />

          {/* Error pulse ripple */}
          <circle
            cx={62}
            cy={62}
            r={59}
            stroke="#B0000A"
            strokeWidth={1.5}
            style={{
              opacity: 0,
              transformOrigin: 'center',
              animation: 'shrellRipple 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.6s both',
            }}
          />

          {/* Cross line 1: top-left to bottom-right */}
          <path
            d="M45 45 L79 79"
            pathLength={1}
            stroke="#F1EEEE"
            strokeWidth={6}
            strokeLinecap="round"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1.1,
              animation: 'shrellDrawTick 0.5s cubic-bezier(0.22, 1, 0.36, 1) 1.65s both',
            }}
          />

          {/* Cross line 2: top-right to bottom-left */}
          <path
            d="M79 45 L45 79"
            pathLength={1}
            stroke="#FF000E"
            strokeWidth={6}
            strokeLinecap="round"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1.1,
              animation: 'shrellDrawTick 0.5s cubic-bezier(0.22, 1, 0.36, 1) 1.75s both',
            }}
          />
        </svg>
      </div>
    </div>
  );
};
