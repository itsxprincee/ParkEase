import React from "react";

const variants = {
  default: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80",
  success: "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  danger: "bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  info: "bg-sky-500/10 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-500/20",
  purple: "bg-purple-500/10 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  primary: "bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  black: "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs",
};

const dotColors = {
  default: "bg-zinc-400 dark:bg-zinc-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  purple: "bg-purple-500",
  primary: "bg-blue-500",
  black: "bg-white dark:bg-zinc-950",
};

const sizes = {
  xs: "px-2 py-0.5 text-[10px] rounded-full",
  sm: "px-2.5 py-1 text-xs rounded-full",
  md: "px-3 py-1.5 text-xs rounded-full",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = "",
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-bold leading-none whitespace-nowrap",
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.sm,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] ?? dotColors.default
          }`}
        />
      )}
      {children}
    </span>
  );
}
