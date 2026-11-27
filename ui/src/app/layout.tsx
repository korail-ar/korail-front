import type { Metadata, Viewport } from 'next';

import AppViewport from './AppViewport';
import notoSansKr from './fonts';

import './globals.css';

export const metadata: Metadata = {
  title: '대전역 길안내',
  description: '대전역 실내 시설과 경로를 안내합니다.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {/*
          휴대폰 화면(Figma 375px) 기준 앱. 넓은 화면에서는 가운데 한 줄로 둔다.
          높이는 화면에 고정해 페이지 전체가 스크롤되지 않게 하고, 넘치는 내용은 각 화면 본문(ScreenBody) 안에서만 스크롤한다.
        */}
        <AppViewport>{children}</AppViewport>
      </body>
    </html>
  );
}
