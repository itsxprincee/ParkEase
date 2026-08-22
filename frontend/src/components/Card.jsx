import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
  padding = "p-6",
  onClick = null,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={[
        "bg-white rounded-2xl border border-[#e0e0e0]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "transition-all duration-200",
        hover
          ? "hover:border-[#a0a0a0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 cursor-pointer"
          : "",
        onClick ? "cursor-pointer" : "",
        padding,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle = "",
  icon: Icon = null,
  trend = null,
  iconBg = "bg-[#f0f0f0]",
  iconColor = "text-[#0a0a0a]",
  className = "",
  onClick = null,
}) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#737373] uppercase tracking-wide leading-none">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#0a0a0a] mt-2 tracking-tight leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#a0a0a0] mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex items-center gap-2">
          <span
            className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
              trend.positive
                ? "bg-[#f0fdf4] text-[#166534]"
                : "bg-[#fef2f2] text-[#991b1b]"
            }`}
          >
            {trend.value}
          </span>
          <span className="text-[11px] text-[#a0a0a0] font-medium">vs last period</span>
        </div>
      )}
    </Card>
  );
}

export default Card;