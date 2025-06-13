import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* <main className="flex-grow container mx-auto px-4 py-8"> */}
      <main className="flex-grow container mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}
