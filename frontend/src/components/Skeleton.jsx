import React from "react";

export function Skeleton({ className = "", height = "h-4", rounded = "rounded-lg" }) {
  return (
    <div
      className={`animate-shimmer ${height} ${rounded} ${className}`}
      style={{
        background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e0e0] p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <Skeleton height="h-11" className="w-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton height="h-4" className="w-2/3" />
          <Skeleton height="h-3" className="w-1/2" />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} height="h-3" className={i === lines - 2 ? "w-3/4" : "w-full"} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e0e0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5 flex-1">
          <Skeleton height="h-3" className="w-24" />
          <Skeleton height="h-8" className="w-16" />
          <Skeleton height="h-3" className="w-20" />
        </div>
        <Skeleton height="h-11" className="w-11 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

export default Skeleton;
