import Studio from '@/components/studio';
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Studio />
      {children}
    </>
  );
}
