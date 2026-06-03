import React from 'react';
import logoAsset from '@/assets/beautyflow-logo.asset.json';

interface Props {
  className?: string;
  /** Show the wordmark+icon variant; default false (icon only). */
  withWordmark?: boolean;
  alt?: string;
}

/**
 * Official BeautyFlow logo. The source image bundles both the icon (left)
 * and the wordmark (right). We crop with object-position when only the icon
 * is needed so a single asset serves every placement.
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
  // Crop to icon only: source icon sits in the left third of the image.
  return (
    <div className={`${className} overflow-hidden`} aria-label={alt} role="img">
      <img
        src={logoAsset.url}
        alt=""
        aria-hidden
        className="h-full w-auto max-w-none"
        style={{ transform: 'translateX(-12%) scale(2.7)', transformOrigin: 'left center' }}
      />
    </div>
  );
}