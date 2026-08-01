import './globals.css';
import { Fraunces, Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import RegisterServiceWorker from '@/components/RegisterServiceWorker';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'StudyHallPro — Admin Console',
  description: 'Study Hall Management SaaS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StudyHallPro',
  },
};

export const viewport = {
  themeColor: '#0d9488',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="text-gray-900 antialiased">
        <RegisterServiceWorker />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
