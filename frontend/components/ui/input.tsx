import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "flex h-11 w-full rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink shadow-[inset_0_1px_2px_rgba(28,24,20,0.04)] placeholder:text-muted/70 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger focus:border-danger focus:ring-danger-soft",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
