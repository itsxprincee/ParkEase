import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary, secondary, outline, danger, success, ghost, white
  size = "md", // sm, md, lg, xl
  className = "",
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  fullWidth = false,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2 shadow-xs",
    lg: "px-5 py-3 text-sm font-semibold gap-2.5 shadow-sm",
    xl: "px-6 py-3.5 text-base font-bold gap-3 shadow-md",
  };

  const variantStyles = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 hover:shadow-indigo-500/30 focus:ring-indigo-500 border border-indigo-600 hover:border-indigo-700",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-slate-200",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 focus:ring-indigo-500 shadow-xs",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 focus:ring-rose-500 border border-rose-600",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 focus:ring-emerald-500 border border-emerald-600",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400",
    white:
      "bg-white hover:bg-slate-50 text-indigo-600 font-semibold shadow-md hover:shadow-lg focus:ring-white border border-slate-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {IconRight && <IconRight className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}