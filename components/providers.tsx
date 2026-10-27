"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Makes every framer-motion animation in the app honour prefers-reduced-motion. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
