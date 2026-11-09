import type { FC } from 'react';

export interface MCLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color' | 'transparent';
  alt?: string;
}

export const MCLogo: FC<MCLogoProps> = ({
  className = 'h-24',
  alt = 'M&C Construcciones Civiles S.A.S.',
}) => {
  return (
    <div className={`flex items-center justify-center select-none shrink-0 ${className}`}>
      <img
        src="/logo-myc.png"
        alt={alt}
        className="h-full w-auto max-h-full object-contain pointer-events-none"
        loading="eager"
        decoding="sync"
      />
    </div>
  );
};
