import type { Metadata } from 'next';

import notoSansKr from './fonts';

import './globals.css';

export const metadata: Metadata = {
  title: '대전역 길안내',
  description: '대전역 실내 시설과 경로를 안내합니다.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {/* 휴대폰 화면(Figma 375px) 기준 앱. 넓은 화면에서는 가운데 한 줄로 둔다. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">{children}</div>
      </body>
    </html>
  );
}
