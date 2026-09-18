import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';
import { requireAdminPage } from './guard';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-slate-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo size="md" textColor="text-white" />
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <nav>
            <Link href="/" className="text-sm hover:text-slate-300">
              Back to Main Site
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-slate-800 text-white py-4 text-center text-xs">
        CupidMatch Admin &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

