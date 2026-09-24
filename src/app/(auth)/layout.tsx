import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-background to-rose-50 px-4 py-6 sm:justify-center sm:p-8">
      <div className="mb-6 flex w-full justify-center sm:absolute sm:left-8 sm:top-8 sm:mb-0 sm:w-auto sm:justify-start">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} CupidMatch. All rights reserved.
      </p>
    </div>
  );
}
