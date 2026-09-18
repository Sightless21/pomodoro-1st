"use client";

import * as React from "react";
import { MetaBalls } from "@/components/ui/meta-balls";

export function FocusBackground() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-0 -z-10 pointer-events-none"
    >
      {height > 0 && (
        <MetaBalls tone="olive" speed={0.6} count={90} height={height} />
      )}
    </div>
  );
}