export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CupidMatch. All rights reserved.</p>
        <p className="mt-1">Crafting Connections, Building Futures.</p>
      </div>
    </footer>
  );
}
