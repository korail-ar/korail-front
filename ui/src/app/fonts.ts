import { Noto_Sans_KR } from 'next/font/google';

// 디자인 기준 글꼴. CSS 변수로 노출해서 tokens.css의 --font-sans가 참조한다.
const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
});

export default notoSansKr;
