import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function Logo({ className, iconSize = 28, textSize = "text-3xl" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <HeartHandshake className="text-primary" size={iconSize} />
      <span className={`font-headline font-bold ${textSize} text-primary`}>MatchCraft</span>
    </Link>
  );
}
