import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { FiGlobe, FiCheck, FiSearch, FiChevronDown } from "react-icons/fi";

export default function LanguageSwitcher({ variant = "dropdown", className = "" }) {
  const { language, setLanguage, LANGUAGES, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase()) ||
      l.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`notranslate relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notranslate flex items-center justify-between gap-1.5 w-full px-2.5 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 text-xs font-semibold transition-all active:scale-95"
        title="Language (Default: English)"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">{currentLanguage.flag}</span>
          <span className="font-bold truncate">{currentLanguage.native}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase shrink-0">
            ({currentLanguage.code})
          </span>
        </div>
        <FiChevronDown className={`w-3 h-3 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="notranslate absolute right-0 mt-2 w-72 max-h-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-2 z-50 animate-slide-down flex flex-col">
          <div className="px-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="notranslate text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Language
              </span>
              <span className="notranslate text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                13 Languages
              </span>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search language..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="notranslate w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-60 py-1 divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {filtered.length === 0 ? (
              <div className="notranslate px-4 py-3 text-xs text-zinc-400 text-center">
                No matching language found
              </div>
            ) : (
              filtered.map((lang) => {
                const active = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`notranslate w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                      active
                        ? "bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                        : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{lang.native}</span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            ({lang.name})
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {lang.region}
                        </p>
                      </div>
                    </div>
                    {active && <FiCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
