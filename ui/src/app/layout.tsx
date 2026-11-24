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
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
