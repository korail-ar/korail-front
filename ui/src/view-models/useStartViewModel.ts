'use client';

import { useRouter } from 'next/navigation';

import useJourney, { buildHref } from '@/lib/station/useJourney';

function safeNextPath(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function useStartViewModel() {
  const router = useRouter();
  const { params, start } = useJourney();
  const next = safeNextPath(params.get('next'));
  const [nextPath, nextQuery = ''] = next.split('?');

  return {
    startId: start.id,
    backHref: next,
    selectStart: (id: string) =>
      router.push(
        buildHref(nextPath, new URLSearchParams(nextQuery), { start: id }, [
          'to',
          'platform',
          'q',
          'category',
          'step',
        ]),
      ),
  };
}
