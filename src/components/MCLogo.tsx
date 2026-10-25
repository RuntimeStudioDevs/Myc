import React from 'react';

interface MCLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
}

export const MCLogo: React.FC<MCLogoProps> = ({ className = 'h-14', variant = 'light' }) => {
  const isLight = variant === 'light';
  const textColor = isLight ? '#FFFFFF' : '#173258';
  const accentColor = isLight ? '#93C5FD' : '#2563EB';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <svg
        viewBox="0 0 100 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto aspect-[100/85] shrink-0"
      >
        {/* Roof / Truss peak */}
        <path
          d="M 50 8 L 8 45 L 20 45 L 50 19 L 80 45 L 92 45 Z"
          fill="currentColor"
          className={isLight ? 'text-white' : 'text-[#173258]'}
        />

        {/* Left House Frame & Window Grid */}
        <g stroke="currentColor" strokeWidth="2.5" className={isLight ? 'text-white' : 'text-[#173258]'}>
          {/* House inner wall */}
          <rect x="24" y="32" width="18" height="18" fill="none" rx="1" />
          {/* 4-pane window */}
          <line x1="33" y1="32" x2="33" y2="50" />
          <line x1="24" y1="41" x2="42" y2="41" />
        </g>

        {/* Right Skyscraper / Civil Construction Tower with grid */}
        <g fill="currentColor" className={isLight ? 'text-white' : 'text-[#173258]'}>
          {/* Segmented blocks ascending */}
          <rect x="58" y="24" width="7" height="6" rx="0.5" />
          <rect x="68" y="24" width="8" height="6" rx="0.5" />
          <rect x="79" y="24" width="8" height="6" rx="0.5" />

          <rect x="58" y="33" width="7" height="6" rx="0.5" />
          <rect x="68" y="33" width="8" height="6" rx="0.5" />
          <rect x="79" y="33" width="8" height="6" rx="0.5" />

          <rect x="58" y="42" width="7" height="6" rx="0.5" />
          <rect x="68" y="42" width="8" height="6" rx="0.5" />
          <rect x="79" y="42" width="8" height="6" rx="0.5" />
        </g>

        {/* Civil engineering foundation arch curve */}
        <path
          d="M 12 56 Q 50 49 88 56"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* M&C Monogram text inside logo mark */}
        <text
          x="50"
          y="73"
          textAnchor="middle"
          fill={textColor}
          fontWeight="900"
          fontSize="17"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          letterSpacing="1"
        >
          M&C
        </text>

        {/* Sub-label CONSTRUCCIONES CIVILES */}
        <text
          x="50"
          y="82"
          textAnchor="middle"
          fill={isLight ? '#CBD5E1' : '#475569'}
          fontWeight="700"
          fontSize="5.8"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          letterSpacing="1.2"
        >
          CONSTRUCCIONES CIVILES
        </text>
      </svg>
    </div>
  );
};
