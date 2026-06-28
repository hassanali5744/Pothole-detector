import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-secondary">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          "flex h-11 w-full rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink shadow-[inset_0_1px_2px_rgba(28,24,20,0.04)] transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
);
Select.displayName = "Select";
