import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "navy";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-[#b87333] text-white hover:bg-[#9a5f28] shadow-[0_1px_2px_rgba(154,95,40,0.2),0_4px_12px_rgba(154,95,40,0.15)]",
  navy: "bg-[#152a45] text-white hover:bg-[#0c1929] shadow-[0_1px_2px_rgba(21,42,69,0.2),0_4px_12px_rgba(21,42,69,0.15)]",
  secondary: "bg-surface-muted text-ink hover:bg-line/40 border border-line",
  outline:
    "border border-line-strong bg-surface text-ink-secondary hover:bg-surface-muted hover:border-brand-200",
  ghost: "text-muted hover:bg-surface-muted hover:text-ink",
  danger: "bg-danger text-white hover:bg-red-800",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-7 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
