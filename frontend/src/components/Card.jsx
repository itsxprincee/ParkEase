import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
  glass = false,
  padding = "p-6",
  onClick = null,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border transition-all duration-200
        ${glass ? "glass-panel" : "bg-white border-slate-200/90 shadow-card"}
        ${hover ? "hover:border-indigo-300 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer" : ""}
        ${padding}
        ${className}
      `}
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
  trend = null, // { value: "+12%", positive: true }
  iconColor = "text-indigo-600 bg-indigo-50 border-indigo-100",
  className = "",
  onClick = null,
}) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs ${iconColor}`}
          >
            <Icon className="w-6 h-6 shrink-0" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
          <span
            className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
              trend.positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {trend.value}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            vs last period
          </span>
        </div>
      )}
    </Card>
  );
}

export default Card;