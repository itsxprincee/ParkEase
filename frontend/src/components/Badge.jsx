import React from "react";

export default function Badge({
  children,
  variant = "default",
  size = "md",
  icon: Icon = null,
  dot = false,
  className = "",
}) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-semibold gap-2",
  };

  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80",
    info: "bg-sky-50 text-sky-700 border-sky-200/80",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80",
    active: "bg-emerald-50 text-emerald-700 border-emerald-300",
    booked: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    available: "bg-emerald-50 text-emerald-700 border-emerald-300",
    occupied: "bg-rose-50 text-rose-700 border-rose-200",
    maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const dotColors = {
    default: "bg-slate-400",
    primary: "bg-indigo-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
    purple: "bg-purple-500",
    active: "bg-emerald-500 animate-pulse",
    booked: "bg-blue-500",
    completed: "bg-slate-400",
    cancelled: "bg-rose-500",
    available: "bg-emerald-500",
    occupied: "bg-rose-500",
    maintenance: "bg-amber-500",
  };

  const selectedVariant = variantClasses[variant] || variantClasses.default;
  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const selectedDot = dotColors[variant] || dotColors.default;

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors duration-150 ${selectedVariant} ${selectedSize} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${selectedDot}`} />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
