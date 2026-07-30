import React from 'react';
import bfIcon from '@/assets/BF.png';
import logoAsset from '@/assets/beautyflow-logo.asset.json';

interface Props {
  className?: string;
  /** Show the wordmark+icon variant; default false (icon only). */
  withWordmark?: boolean;
  alt?: string;
}

/**
 * Official BeautyFlow logo component.
 * Renders BF icon perfectly filling a circular frame as requested.
 */
export function BeautyFlowLogo({ className = 'h-8 w-8', withWordmark = false, alt = 'BeautyFlow' }: Props) {
  if (withWordmark) {
    return (
      <img
        src={logoAsset.url}
        alt={alt}
        className={className}
        style={{ objectFit: 'contain' }}
        loading="eager"
      />
    );
  }

  return (
    <div className={`${className} rounded-full overflow-hidden flex items-center justify-center bg-rose-500 shadow-md ring-2 ring-rose-400/40 shrink-0 transition-transform hover:scale-105`}>
      <img
        src={bfIcon}
        alt={alt}
        className="w-full h-full object-cover scale-110"
        loading="eager"
      />
    </div>
  );
}