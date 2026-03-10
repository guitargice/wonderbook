"use client";

import { motion } from "framer-motion";

type GenerationOverlayProps = {
  visible: boolean;
};

export function GenerationOverlay({ visible }: GenerationOverlayProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-indigo-950/55 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm rounded-2xl border border-indigo-200/50 bg-white/90 p-6 text-center shadow-2xl"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 2.2 }}
          className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-indigo-200 border-t-fuchsia-500"
        />
        <h3 className="mb-2 text-lg font-semibold text-indigo-900">Turning the magical page...</h3>
        <p className="text-sm text-indigo-700">
          Your drawing is coming to life in storybook motion.
        </p>
      </motion.div>
    </div>
  );
}
