import { notFound } from 'next/navigation';

import NavigationDebugClient from './NavigationDebugClient';

export default function NavigationDebugPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <NavigationDebugClient />;
}
