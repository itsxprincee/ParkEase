import React, { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}) {
  const overlayRef = useRef(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className={`
          relative w-full ${maxWidth} bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90
          rounded-t-[32px] sm:rounded-3xl
          shadow-[0_24px_64px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.8)]
          animate-spring-in
          max-h-[90vh] overflow-y-auto
        `}
      >
        {/* Mobile Pull Bar */}
        <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiX className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 text-zinc-800 dark:text-zinc-200">{children}</div>
      </div>
    </div>
  );
}
