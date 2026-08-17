"use client";

import { motion } from "framer-motion";

interface PulseGlowProps {
  children: React.ReactNode;
  className?: string;
}

export function PulseGlow({ children, className = "" }: PulseGlowProps) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          "0 0 0 0px rgba(232, 201, 154, 0.4)",
          "0 0 0 10px rgba(232, 201, 154, 0)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
