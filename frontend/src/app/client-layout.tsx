// app/client-layout.tsx (Client Component)
'use client';

import { AuthProvider } from '@/lib/auth';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}