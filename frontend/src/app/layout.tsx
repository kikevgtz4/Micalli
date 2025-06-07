import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AppContent from '@/components/AppContent';
import { RoommateProvider } from '@/contexts/RoommateContext';

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
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <RoommateProvider>
            <AppContent>{children}</AppContent>
          </RoommateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}