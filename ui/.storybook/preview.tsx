import '../src/app/globals.css';

import type { Preview } from '@storybook/nextjs-vite';

import notoSansKr from '../src/app/fonts';

// 앱(layout.tsx)처럼 글꼴 변수를 <html>에 둔다. :root의 --font-sans가 이 변수를 참조하므로
// 안쪽 요소에만 두면 :root에서 값이 비어 글꼴이 적용되지 않는다.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add(notoSansKr.variable);
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
    options: {
      storySort: {
        order: ['Foundations', 'Design Sheet', 'Components', 'Map'],
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="font-sans text-ink">
        <Story />
      </div>
    ),
  ],
};

export default preview;
