import React from "react";
import { FiInbox } from "react-icons/fi";

export default function EmptyState({
  icon: Icon = FiInbox,
  title = "Nothing here yet",
  description = "",
  actionLabel = "",
  onAction = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5 border border-zinc-200/60 dark:border-zinc-700/60">
        <Icon className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors active:scale-95 shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
