import React from "react";

const variants = {
  default: "bg-[#f0f0f0] text-[#545454]",
  success: "bg-[#f0fdf4] text-[#166534]",
  warning: "bg-[#fffbeb] text-[#92400e]",
  danger: "bg-[#fef2f2] text-[#991b1b]",
  info: "bg-[#eff6ff] text-[#1e40af]",
  purple: "bg-[#faf5ff] text-[#6b21a8]",
  primary: "bg-[#f0f4ff] text-[#276ef1]",
  black: "bg-[#0a0a0a] text-white",
};

const dotColors = {
  default: "bg-[#a0a0a0]",
  success: "bg-[#05944f]",
  warning: "bg-[#f5a623]",
  danger: "bg-[#e11900]",
  info: "bg-[#276ef1]",
  purple: "bg-[#7c3aed]",
  primary: "bg-[#276ef1]",
  black: "bg-white",
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
