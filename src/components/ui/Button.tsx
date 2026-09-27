import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-sage text-white hover:bg-sage-dark disabled:bg-sage/50",
  secondary:
    "bg-sage-light text-charcoal hover:bg-sage-light/70 disabled:opacity-50",
  ghost: "bg-transparent text-sage-dark hover:bg-sage-light disabled:opacity-40",
  destructive: "bg-declined text-white hover:opacity-90 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size={16} />}
      {children}
    </button>
  );
}
