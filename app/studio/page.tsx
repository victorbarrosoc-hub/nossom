import type { Metadata } from 'next';
import Studio from '@/components/studio';
export const metadata: Metadata = { title: 'Seu estúdio' };
export default function Page() {
  return <Studio />;
}
