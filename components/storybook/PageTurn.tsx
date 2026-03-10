"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

type PageTurnProps = {
  pageKey: string;
  children: ReactNode;
};

export function PageTurn({ pageKey, children }: PageTurnProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ rotateY: -18, opacity: 0, x: 20 }}
        animate={{ rotateY: 0, opacity: 1, x: 0 }}
        exit={{ rotateY: 16, opacity: 0, x: -20 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="origin-left"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
