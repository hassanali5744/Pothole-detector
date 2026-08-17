"use client";

import { motion } from "framer-motion";

interface SlideInLeftProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideInLeft({ children, delay = 0, duration = 0.5, className = "" }: SlideInLeftProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
