'use client';

import { useEffect, type ReactNode } from 'react';

/** 모바일 키보드가 열린 동안에도 앱 높이를 실제로 보이는 화면에 맞춘다. */
export default function AppViewport({ children }: { children: ReactNode }) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const updateHeight = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-viewport-height', `${height}px`);
    };

    updateHeight();
    viewport?.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight);
    return () => {
      viewport?.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.removeProperty('--app-viewport-height');
    };
  }, []);

  return (
    <div className="mx-auto flex h-[var(--app-viewport-height,100dvh)] w-full max-w-md flex-col overflow-hidden bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {children}
    </div>
  );
}
