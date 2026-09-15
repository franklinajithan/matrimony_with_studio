import { Logo } from '@/components/shared/Logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-rose-50 p-4">
      <div className="absolute top-6 left-4 sm:top-8 sm:left-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} CupidMatch. All rights reserved.
      </p>
    </div>
  );
}
