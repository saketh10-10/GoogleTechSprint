"use client";

import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash by not rendering until mounted
  // Theme is already set by inline script in layout
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
