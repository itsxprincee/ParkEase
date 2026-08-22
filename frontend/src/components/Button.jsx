import React from "react";

const sizeMap = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-sm gap-2.5",
  xl: "px-7 py-3.5 text-base gap-3",
};

const variantMap = {
  primary:
    "bg-[#0a0a0a] text-white hover:bg-[#242424] focus:ring-2 focus:ring-black/20 shadow-sm",
  secondary:
    "bg-[#f0f0f0] text-[#0a0a0a] hover:bg-[#e0e0e0] focus:ring-2 focus:ring-black/10 border border-[#e0e0e0]",
  outline:
    "bg-white text-[#0a0a0a] border border-[#e0e0e0] hover:border-[#0a0a0a] hover:bg-[#f7f7f7] focus:ring-2 focus:ring-black/10",
  danger:
    "bg-[#e11900] text-white hover:bg-[#c51500] focus:ring-2 focus:ring-red-400/30 shadow-sm",
  success:
    "bg-[#05944f] text-white hover:bg-[#047340] focus:ring-2 focus:ring-green-400/30 shadow-sm",
  ghost:
    "bg-transparent text-[#545454] hover:bg-[#f0f0f0] hover:text-[#0a0a0a] focus:ring-2 focus:ring-black/10",
  white:
    "bg-white text-[#0a0a0a] border border-[#e0e0e0] hover:shadow-md focus:ring-2 focus:ring-black/10 shadow-sm",
  accent:
    "bg-[#276ef1] text-white hover:bg-[#1d5cd4] focus:ring-2 focus:ring-blue-400/30 shadow-sm",
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-semibold rounded-xl",
        "transition-all duration-150 cursor-pointer select-none",
        "focus:outline-none active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        sizeMap[size] ?? sizeMap.md,
        variantMap[variant] ?? variantMap.primary,
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-current shrink-0"
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
          <span>Loading…</span>
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