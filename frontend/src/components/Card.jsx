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
        "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
        "transition-all duration-200",
        hover
          ? "hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 cursor-pointer"
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
  iconBg = "bg-zinc-100 dark:bg-zinc-800",
  iconColor = "text-zinc-900 dark:text-zinc-100",
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
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide leading-none">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-2 tracking-tight leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 font-medium">{subtitle}</p>
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
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
          <span
            className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
              trend.positive
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
            }`}
          >
            {trend.value}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">vs last period</span>
        </div>
      )}
    </Card>
  );
}

export default Card;