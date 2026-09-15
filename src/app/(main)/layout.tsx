import { MainChrome } from "@/components/navigation/MainChrome";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainChrome>{children}</MainChrome>;
}
