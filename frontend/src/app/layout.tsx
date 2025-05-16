import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AppContent from '@/components/AppContent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UniHousing | Student Housing Platform',
  description: 'Find student housing near your university in Monterrey',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Using a data attribute instead of className directly can help avoid hydration issues
  return (
    <html lang="en">
      <body data-font-class={inter.className} className={inter.className}>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}