"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  distance = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`will-change-transform ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : `translate3d(0,${distance}px,0)`,
        transition: `opacity 700ms cubic-bezier(.2,.8,.2,1) ${delay}ms, transform 850ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
