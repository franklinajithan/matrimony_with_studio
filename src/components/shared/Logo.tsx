
import Link from 'next/link';
import { Heart } from 'lucide-react'; // Using Lucide Heart, can be replaced with custom SVG

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  textColor?: string; // Added for flexibility
}

export function Logo({ 
  className, 
  iconSize = 28, 
  textSize = "text-3xl",
  textColor = "text-primary" // Default to primary, can be overridden
}: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-1.5 ${className}`}>
      <span className={`font-headline font-bold ${textSize} ${textColor} tracking-tight`}>CUPID</span>
      <Heart className="text-red-500 fill-current animate-bounce" size={iconSize * 0.8} /> {/* Heart is now red */}
      <span className={`font-headline font-bold ${textSize} ${textColor} tracking-tight`}>KNOTS</span>
    </Link>
  );
}
