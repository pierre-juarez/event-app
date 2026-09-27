import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-card border border-hairline shadow-sm p-4",
        className
      )}
      {...props}
    />
  );
}
