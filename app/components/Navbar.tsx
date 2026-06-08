"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-slate-950 border-b border-black/10 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
          RobertCare
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/auth"
            className="text-sm font-bold text-black dark:text-slate-100 hover:opacity-70 transition-opacity"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/auth"
            className="px-4 py-2 bg-black hover:bg-black/80 dark:bg-white dark:hover:bg-white/90 text-white dark:text-black text-sm font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            Registrarme gratis
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
