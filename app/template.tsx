"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Re-mounts on every navigation, giving a short opacity fade between pages.
 * Opacity only: a transform here would break position: fixed children such as the nav.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
