"use client";

import * as React from "react";

/** Fit paper to its container, reserving the scaled height for every page. */
export function ResponsiveDocumentPreview({ children, pageSize = "a4" }: {
  children: React.ReactNode;
  pageSize?: "a4" | "letter";
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const paperRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const paperWidth = pageSize === "letter" ? 816 : 210 * 96 / 25.4;

  React.useEffect(() => {
    const container = containerRef.current;
    const paper = paperRef.current;
    if (!container || !paper) return;
    const measure = () => setSize({ width: container.clientWidth, height: paper.offsetHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(paper);
    measure();
    return () => observer.disconnect();
  }, []);

  const scale = size.width > 0 ? Math.min(1, size.width / paperWidth) : 0;
  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-hidden" data-biodata-preview>
      <div className="relative mx-auto" style={{ width: paperWidth * scale, height: size.height * scale }}>
        <div ref={paperRef} className="absolute left-0 top-0 origin-top-left"
          style={{ width: paperWidth, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
