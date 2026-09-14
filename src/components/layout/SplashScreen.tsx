import React, { useEffect, useState } from 'react';
import bfIcon from '@/assets/BF.png';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export function SplashScreen({ onFinish, minDuration = 2800 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
    }, 600);

    const timer2 = setTimeout(() => {
      setProgress(75);
    }, 1400);

    const timer3 = setTimeout(() => {
      setProgress(100);
    }, 2200);

    const finishTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 600); // 600ms smooth fade duration
    }, minDuration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white select-none overflow-hidden transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 2rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 2rem)',
      }}
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/25 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Subtle Top Decorative Indicator */}
      <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold tracking-widest uppercase">
        <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="text-rose-200/80 text-[10px]">BeautyFlow Pro Suite</span>
      </div>

      {/* Center Branding Showcase */}
      <div className="flex flex-col items-center justify-center text-center px-6 max-w-sm w-full space-y-6">
        
        {/* Animated Icon Container */}
        <div className="relative group">
          {/* Pulsing ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 opacity-40 blur-md animate-pulse" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-rose-600 to-pink-500 shadow-2xl shadow-rose-500/30 flex items-center justify-center overflow-hidden transition-transform duration-700 hover:scale-105">
            <div className="w-full h-full rounded-[22px] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-3">
              <img
                src={bfIcon}
                alt="BeautyFlow"
                className="w-full h-full object-contain drop-shadow-md transform transition-all duration-700 animate-[scale-in_0.6s_ease-out]"
              />
            </div>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Beauty<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300">Flow</span>
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
              BUSINESS
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
            L'excellence & la gestion intelligente au service de votre salon
          </p>
        </div>

        {/* Sleek Progress Bar */}
        <div className="w-48 sm:w-56 space-y-2 pt-2">
          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 transition-all duration-500 ease-out shadow-sm shadow-rose-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center">
            <span className="text-[10px] font-medium text-slate-500 animate-pulse">
              Chargement de votre espace...
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Footer Info */}
      <div className="text-center space-y-1 text-slate-500 text-[11px] font-medium">
        <p>© {new Date().getFullYear()} BeautyFlow Ecosystem</p>
      </div>

    </div>
  );
}
