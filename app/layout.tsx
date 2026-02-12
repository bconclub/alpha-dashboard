import type { Metadata } from 'next';
import './globals.css';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { Sidebar } from '@/components/ui/Sidebar';

export const metadata: Metadata = {
  title: 'Alpha Dashboard',
  description: 'Real-time trading dashboard for Alpha crypto bot',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-white antialiased">
        <SupabaseProvider>
          <Sidebar />
          <main className="ml-64 min-h-screen p-6">{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
