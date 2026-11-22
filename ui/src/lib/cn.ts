import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 조건부 클래스를 합치고, 충돌하는 Tailwind 유틸리티는 뒤에 온 것을 남긴다(CONVENTIONS.md 5절).
export default function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
