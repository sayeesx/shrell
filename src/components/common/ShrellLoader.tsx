import React from 'react';

interface ShrellLoaderProps {
  size?: number;
  className?: string;
  fullPage?: boolean;
}

export const ShrellLoader: React.FC<ShrellLoaderProps> = ({
  size = 68,
  className = '',
  fullPage = false,
}) => {
  const content = (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        viewBox="270 277 1386 1383"
        role="img"
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="overflow-hidden"
      >
        <path
          className="shrell-loader-path"
          d="M290,430 Q290,297 420,297 L1150,297 L1050,435 Q1010,483 950,483 L745,483 Q690,490 655,522 L470,730 Q440,775 430,850 L420,950 Q400,1050 292,1065 Z"
        />
        <path
          className="shrell-loader-path"
          d="M880,580 L985,581 L545,1112 Q520,1135 490,1135 L430,1135 Q405,1130 405,1103 Q405,1090 415,1080 L790,630 Q830,585 880,580 Z"
        />
        <path
          className="shrell-loader-path"
          d="M1415,297 L1510,297 Q1630,300 1636,430 L1636,662 L1340,662 Q1290,670 1255,710 L930,1110 L650,1282 Q620,1313 570,1313 L290,1313 L290,1520 Q295,1635 415,1640 L520,1640 Z"
        />
        <path
          className="shrell-loader-path"
          d="M1410,838 L1500,838 Q1525,845 1522,875 L1150,1315 Q1110,1360 1050,1360 L950,1360 L1370,865 Q1390,840 1410,838 Z"
        />
        <path
          className="shrell-loader-path"
          d="M1636,910 L1636,1520 Q1630,1635 1510,1640 L750,1640 L840,1515 Q880,1490 935,1488 L1355,1488 Q1430,1480 1448,1400 L1505,1050 Q1530,925 1636,910 Z"
        />
      </svg>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 select-none">
        {content}
      </div>
    );
  }

  return content;
};
