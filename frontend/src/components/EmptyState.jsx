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
      <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-[#a0a0a0]" />
      </div>
      <h3 className="text-base font-bold text-[#0a0a0a] tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-[#737373] mt-2 max-w-sm leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-5 py-2.5 bg-[#0a0a0a] text-white text-sm font-semibold rounded-xl hover:bg-[#242424] transition-colors active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
