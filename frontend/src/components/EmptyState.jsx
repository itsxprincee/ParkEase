import React from "react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-white border border-dashed border-slate-300/80 my-4 ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
