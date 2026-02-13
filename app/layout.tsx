import type { Metadata } from 'next';
import './globals.css';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';

export const metadata: Metadata = {
  title: 'Alpha Dashboard — Trading Command Center',
  description: 'Real-time trading command center for Alpha crypto bot',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0d1117] text-white antialiased">
        <SupabaseProvider>
          <div className="min-h-screen">
            {/* Top bar */}
            <header className="border-b border-zinc-800 bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-50">
              <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00c853] animate-pulse" />
                  <span className="text-lg font-bold tracking-widest text-white">ALPHA</span>
                  <span className="text-xs text-zinc-500 hidden sm:inline">COMMAND CENTER</span>
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="max-w-[1920px] mx-auto px-4 py-4">
              {children}
            </main>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
