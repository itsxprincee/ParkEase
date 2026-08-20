import React from "react";

export function Skeleton({ className = "", rounded = "rounded-xl" }) {
  return (
    <div
      className={`bg-slate-200/80 animate-pulse ${rounded} ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }) {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export default Skeleton;
