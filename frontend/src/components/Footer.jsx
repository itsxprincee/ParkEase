import React from "react";
import { Link } from "react-router-dom";
import { FiExternalLink, FiShield, FiZap, FiHeart } from "react-icons/fi";
import { FaLinkedin, FaInstagram } from "react-icons/fa";

export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/in/das-and-singh-exports-758973398?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
  instagram: "https://www.instagram.com/dassinghexports?igsi=MWdkbmQwMXVxM3c1cg==",
};

export default function Footer({ className = "" }) {
  return (
    <footer
      className={`border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#090a0f]/80 backdrop-blur-xl transition-colors ${className}`}
      id="app-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-8 border-b border-slate-100 dark:border-zinc-800/60">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black shadow-md">
                <span className="font-mono text-sm">PE</span>
              </div>
              <div>
                <span className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                  Park<span className="pe-gradient-text">Ease</span>
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Smart Mobility Network
                </p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Next-generation parking management and reservation platform with real-time bay analytics, automated QR barrier sync, and effortless commuter passes.
            </p>

            {/* Social Links */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Connect With Us
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-[#0077b5] text-zinc-700 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-[#0077b5] dark:hover:text-white transition-all text-xs font-bold shadow-xs hover:scale-105 active:scale-95"
                  title="Das and Singh Exports on LinkedIn"
                >
                  <FaLinkedin className="w-4 h-4 text-[#0077b5] group-hover:text-white" />
                  <span>LinkedIn</span>
                  <FiExternalLink className="w-3 h-3 opacity-60" />
                </a>

                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 text-zinc-700 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:from-purple-600 dark:hover:to-pink-600 dark:hover:text-white transition-all text-xs font-bold shadow-xs hover:scale-105 active:scale-95"
                  title="Das and Singh Exports on Instagram"
                >
                  <FaInstagram className="w-4 h-4 text-[#E4405F]" />
                  <span>Instagram</span>
                  <FiExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <li>
                <Link to="/customer/dashboard" className="hover:text-emerald-500 transition-colors">
                  Find Parking
                </Link>
              </li>
              <li>
                <Link to="/customer/subscriptions" className="hover:text-emerald-500 transition-colors">
                  Commuter Passes
                </Link>
              </li>
              <li>
                <Link to="/customer/my-bookings" className="hover:text-emerald-500 transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/customer/my-vehicles" className="hover:text-emerald-500 transition-colors">
                  Vehicle Registry
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              Reliability
            </h4>
            <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <FiShield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Encrypted QR Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <FiZap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Real-Time Bay Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Systems Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} ParkEase · Das & Singh Exports. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-700 dark:hover:text-white transition-colors"
            >
              LinkedIn Profile
            </a>
            <span>•</span>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-700 dark:hover:text-white transition-colors"
            >
              Instagram Profile
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
