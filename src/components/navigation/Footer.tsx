
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CupidMatch. All rights reserved.</p>
        <p className="mt-1">Crafting Connections, Building Futures.</p>
        <div className="mt-2">
          <Link href="/admin" className="hover:text-primary hover:underline">
            Admin Panel
          </Link>
        </div>
      </div>
    </footer>
  );
}
